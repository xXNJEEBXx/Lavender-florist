<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\AiAssistantService;
use App\Services\Ai\ToolRegistry;

class AiChatController extends Controller
{
    protected $aiService;
    protected $toolRegistry;

    public function __construct(AiAssistantService $aiService, ToolRegistry $toolRegistry)
    {
        $this->aiService = $aiService;
        $this->toolRegistry = $toolRegistry;
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'message' => 'nullable|string',
            'image' => 'nullable|image|max:5120', // Max 5MB
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('ai_uploads', 'public');
            $imagePath = 'storage/' . $path;
        }

        if (!$request->message && !$imagePath) {
            return response()->json(['error' => 'Message or image is required.'], 400);
        }

        $userId = $request->user()->id ?? null;

        $response = $this->aiService->sendMessage(
            $request->session_id,
            'web',
            $request->message,
            $imagePath,
            $userId
        );

        return response()->json($response);
    }

    public function getHistory(Request $request)
    {
        $request->validate(['session_id' => 'required|string']);

        $session = \Illuminate\Support\Facades\DB::table('ai_chat_sessions')
            ->where('session_id', $request->session_id)
            ->first();

        if (!$session) {
            return response()->json(['messages' => []]);
        }

        $messages = \Illuminate\Support\Facades\DB::table('ai_messages')
            ->where('ai_chat_session_id', $session->id)
            // We only want to show user messages and model text messages or ui cards. 
            // We can fetch everything and filter on frontend or format here.
            ->orderBy('id', 'asc')
            ->get();

        $formatted = [];
        foreach ($messages as $msg) {
            if ($msg->role === 'user') {
                $formatted[] = [
                    'role' => 'user',
                    'content' => $msg->content,
                    'image' => $msg->image_path ? asset($msg->image_path) : null
                ];
            } elseif ($msg->role === 'model' && $msg->content) {
                $decoded = json_decode($msg->content, true);
                if (is_array($decoded) && isset($decoded[0])) {
                    $extractedText = '';
                    foreach ($decoded as $part) {
                        if (isset($part['text'])) {
                            $extractedText .= $part['text'] . "\n\n";
                        }
                    }
                    if (trim($extractedText) !== '') {
                        $formatted[] = [
                            'role' => 'model',
                            'content' => trim($extractedText),
                            'uiCard' => null
                        ];
                    }
                } else {
                    $formatted[] = [
                        'role' => 'model',
                        'content' => $msg->content,
                        'uiCard' => null
                    ];
                }
            } elseif ($msg->role === 'function') {
                $data = json_decode($msg->content, true);
                if (isset($data['type']) && $data['type'] === 'ui_card') {
                    $formatted[] = [
                        'role' => 'model',
                        'content' => '',
                        'uiCard' => $data
                    ];
                }
                if (isset($data['system_alert_message'])) {
                    $formatted[] = [
                        'role' => 'system_alert',
                        'content' => $data['system_alert_message'],
                        'uiCard' => null
                    ];
                }
            }
        }

        return response()->json(['messages' => $formatted]);
    }

    public function getToolsSchema()
    {
        return response()->json([
            'tools' => $this->toolRegistry->getToolsSchema()
        ]);
    }

    public function executeTool(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'arguments' => 'nullable|array'
        ]);

        try {
            $result = $this->toolRegistry->executeTool($request->name, $request->arguments ?? []);
            return response()->json(['result' => $result]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
