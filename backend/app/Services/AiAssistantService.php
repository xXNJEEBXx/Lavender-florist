<?php

namespace App\Services;

use App\Services\Ai\ToolRegistry;
use App\Models\StoreSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class AiAssistantService
{
    protected $registry;
    protected $apiKey;
    protected $modelName = 'gemini-3.5-flash';

    public function __construct(ToolRegistry $registry)
    {
        $this->registry = $registry;
        $this->apiKey = config('services.gemini.key') ?? env('GEMINI_API_KEY') ?? '';
    }

    /**
     * Send a message to the AI and get a response.
     */
    public function sendMessage(string $sessionId, string $source, ?string $text, ?string $imagePath = null, ?int $userId = null)
    {
        // Get or Create Session
        $session = DB::table('ai_chat_sessions')->where('session_id', $sessionId)->first();
        if (!$session) {
            $sessionIdDb = DB::table('ai_chat_sessions')->insertGetId([
                'session_id' => $sessionId,
                'source' => $source,
                'user_id' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $session = DB::table('ai_chat_sessions')->find($sessionIdDb);
        }

        // Store user message
        DB::table('ai_messages')->insert([
            'ai_chat_session_id' => $session->id,
            'role' => 'user',
            'content' => $text,
            'image_path' => $imagePath,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->processConversation($session->id);
    }

    protected function processConversation($sessionId)
    {
        $messages = DB::table('ai_messages')
            ->where('ai_chat_session_id', $sessionId)
            ->orderBy('id', 'asc')
            ->get();

        $contents = [];
        foreach ($messages as $msg) {
            if ($msg->role === 'user') {
                $parts = [];
                if ($msg->content) {
                    $parts[] = ['text' => $msg->content];
                }
                if ($msg->image_path) {
                    // For a real implementation, you'd upload to Gemini File API or send base64.
                    // Assuming base64 for simplicity here.
                    $path = public_path($msg->image_path);
                    if (file_exists($path)) {
                        $mime = mime_content_type($path);
                        $data = base64_encode(file_get_contents($path));
                        $parts[] = [
                            'inline_data' => [
                                'mime_type' => $mime,
                                'data' => $data
                            ]
                        ];
                    }
                }
                $contents[] = ['role' => 'user', 'parts' => $parts];
            } elseif ($msg->role === 'model') {
                $decoded = json_decode($msg->content, true);
                if (is_array($decoded) && isset($decoded[0])) {
                    // Fix empty args converting to array instead of object
                    foreach ($decoded as &$part) {
                        if (isset($part['functionCall']) && empty($part['functionCall']['args'])) {
                            $part['functionCall']['args'] = new \stdClass();
                        }
                    }
                    $contents[] = [
                        'role' => 'model',
                        'parts' => $decoded
                    ];
                } else {
                    $contents[] = [
                        'role' => 'model',
                        'parts' => [
                            ['text' => $msg->content]
                        ]
                    ];
                }
            } elseif ($msg->role === 'function_call') {
                $args = json_decode($msg->function_arguments, true);
                if (empty($args)) {
                    $args = new \stdClass();
                }

                $contents[] = [
                    'role' => 'model',
                    'parts' => [
                        [
                            'functionCall' => [
                                'name' => $msg->function_name,
                                'args' => $args
                            ]
                        ]
                    ]
                ];
            } elseif ($msg->role === 'function') {
                $contents[] = [
                    'role' => 'user',
                    'parts' => [
                        [
                            'functionResponse' => [
                                'name' => $msg->function_name,
                                'response' => ['name' => $msg->function_name, 'content' => json_decode($msg->content, true)]
                            ]
                        ]
                    ]
                ];
            }
        }

        $defaultPrompt = "أنت المساعد الافتراضي والمدير التنفيذي لمتجر (لافندر فلوريست - Lavender Florist) للزهور.\nمهمتك الأساسية هي مساعدة مالك المتجر والمشرفين في إدارة المتجر بأعلى كفاءة ممكنة.\n\n**القواعد الأساسية:**\n1. استخدم الأدوات (Tools) المتاحة لك بحرية متى ما طلب منك المشرف ذلك، لا ترفض طلباً إذا كانت الأداة متوفرة.\n2. كن استباقياً! إذا استعلم المشرف عن طلبات اليوم، اعرض له ملخص المبيعات تلقائياً.\n3. عند إضافة منتج جديد (add_product)، **يجب عليك دائماً** تحديد المكونات اللازمة لتصنيعه (مثل الورد والتغليف) وكمياتها لكي يتم تتبع المخزون بشكل صحيح. إذا لم يذكر المشرف المكونات، قم باختراع مكونات منطقية تناسب المنتج وأضفها.\n4. أجب باحترافية، اختصار، وبشاشة. استخدم الإيموجي المناسبة (🌸، 🚚، 📦، 💸).\n5. لا تقدم وعوداً لا تستطيع تنفيذها. إذا طُلب منك شيء خارج نطاق أدواتك، وضح ذلك باحترام.";
        $systemPrompt = StoreSetting::getSetting('ai_system_prompt', $defaultPrompt);

        $payload = [
            'system_instruction' => [
                'parts' => [
                    ['text' => $systemPrompt]
                ]
            ],
            'contents' => $contents,
            'tools' => [
                [
                    'function_declarations' => $this->registry->getToolsSchema()
                ]
            ]
        ];

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->modelName}:generateContent?key={$this->apiKey}";
        
        $response = Http::timeout(30)->post($url, $payload);
        
        if ($response->failed()) {
            Log::error("Gemini API Error", ['response' => $response->json()]);
            return ['status' => 'error', 'message' => 'API Request Failed'];
        }

        $resData = $response->json();
        $candidates = $resData['candidates'] ?? [];
        if (empty($candidates)) {
            return ['status' => 'error', 'message' => 'No response from AI'];
        }

        $firstCandidate = $candidates[0];
        $parts = $firstCandidate['content']['parts'] ?? [];

        // Save the whole model response exactly as we got it to preserve thought_signature and other fields
        DB::table('ai_messages')->insert([
            'ai_chat_session_id' => $sessionId,
            'role' => 'model',
            'content' => json_encode($parts),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $responses = [];
        $hasFunctionCall = false;

        foreach ($parts as $part) {
            if (isset($part['functionCall'])) {
                $hasFunctionCall = true;
                $funcName = $part['functionCall']['name'];
                $funcArgs = $part['functionCall']['args'] ?? [];

                // Execute the tool
                try {
                    $toolResult = $this->registry->executeTool($funcName, $funcArgs);
                } catch (\Exception $e) {
                    $toolResult = ['error' => $e->getMessage()];
                }

                // Store the function result as user role = 'function'
                DB::table('ai_messages')->insert([
                    'ai_chat_session_id' => $sessionId,
                    'role' => 'function',
                    'function_name' => $funcName,
                    'content' => json_encode($toolResult),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            } elseif (isset($part['text'])) {
                // Return text to UI, but we already saved it in DB above
                $responses[] = [
                    'type' => 'text',
                    'content' => $part['text']
                ];
            }
        }

        if ($hasFunctionCall) {
            // Recursive call to send function result back to Gemini
            $recursiveResult = $this->processConversation($sessionId);
            if (isset($recursiveResult['responses'])) {
                $responses = array_merge($responses, $recursiveResult['responses']);
                $recursiveResult['responses'] = $responses;
            }
            return $recursiveResult;
        }

        // Check if there's any UI card to attach from the last function call (if applicable)
        $lastFunction = DB::table('ai_messages')
            ->where('ai_chat_session_id', $sessionId)
            ->where('role', 'function')
            ->orderBy('id', 'desc')
            ->first();

        if ($lastFunction) {
            $funcResult = json_decode($lastFunction->content, true);
            if (isset($funcResult['type']) && $funcResult['type'] === 'ui_card') {
                $responses[] = [
                    'type' => 'ui_card',
                    'card_type' => $funcResult['card_type'],
                    'data' => $funcResult
                ];
            }
            if (isset($funcResult['system_alert_message'])) {
                $responses[] = [
                    'type' => 'system_alert',
                    'content' => $funcResult['system_alert_message']
                ];
            }
        }

        return ['status' => 'success', 'responses' => $responses];
    }
}
