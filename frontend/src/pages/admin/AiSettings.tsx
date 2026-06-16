import React, { useState, useEffect } from 'react';
import { adminSettingsApi, aiChatApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Bot, Save, Loader2, Wrench, ChevronDown, ChevronUp } from 'lucide-react';

export default function AiSettings() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tools, setTools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, toolsRes] = await Promise.all([
        adminSettingsApi.getStoreSettings(),
        aiChatApi.getToolsSchema()
      ]);
      
      setSystemPrompt(settingsRes.ai_system_prompt || '');
      setTools(toolsRes.tools || []);
    } catch (err) {
      toast.error('فشل في جلب الإعدادات والأدوات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminSettingsApi.updateStoreSettings({ ai_system_prompt: systemPrompt });
      toast.success('تم حفظ تعليمات الذكاء الاصطناعي بنجاح');
    } catch (err) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">إعدادات المساعد الذكي</h1>
          <p className="text-gray-500">قم بإدارة شخصية المساعد الذكي وصلاحياته والأدوات المتوفرة له.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* System Prompt Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary-50 p-2 rounded-lg">
              <Bot className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">تعليمات النظام (System Prompt)</h2>
              <p className="text-sm text-gray-500">التعليمات الأساسية التي توجه سلوك المساعد الذكي.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <textarea
              rows={8}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y"
              placeholder="مثال: أنت مساعد ذكي لمتجر لافندر للزهور. يجب أن ترد باحترافية وتساعد المشرف في إدارة المتجر..."
            />
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>

        {/* Tools Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-50 p-2 rounded-lg">
              <Wrench className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">الأدوات المتوفرة (Tools)</h2>
              <p className="text-sm text-gray-500">قائمة بالأدوات البرمجية التي يمكن للمساعد الذكي استخدامها للقيام بالمهام.</p>
            </div>
          </div>

          <div className="space-y-3">
            {tools.map((tool, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden transition-all">
                <button
                  onClick={() => setExpandedTool(expandedTool === tool.name ? null : tool.name)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-gray-900 font-mono text-sm">{tool.name}</span>
                    <span className="text-sm text-gray-500 text-right mt-1">{tool.description}</span>
                  </div>
                  {expandedTool === tool.name ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                
                {expandedTool === tool.name && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">المعاملات (Parameters)</h4>
                    {tool.parameters?.properties && Object.keys(tool.parameters.properties).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(tool.parameters.properties).map(([paramName, paramDetails]: [string, any]) => {
                          const isRequired = tool.parameters.required?.includes(paramName);
                          return (
                            <div key={paramName} className="flex flex-col sm:flex-row sm:items-start justify-between bg-gray-50 p-3 rounded-lg gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-primary-700">{paramName}</span>
                                {isRequired && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold">مطلوب</span>}
                                <span className="text-xs text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">{paramDetails.type}</span>
                              </div>
                              <span className="text-sm text-gray-600 sm:text-left">{paramDetails.description}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">لا توجد معاملات لهذه الأداة.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
