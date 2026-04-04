import type {Patient} from "@/lib/mock-data";
import {useEffect, useRef, useState} from "react";
import {apiPost} from "@/lib/api/client";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Bot, Loader2, RotateCcw, Send} from "lucide-react";
import {cn} from "@/lib/utils";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";

interface ChatMsg {
    role: 'user' | 'assistant';
    content: string;
}

function getStorageKey(patientId: string) {
    return `wardian_chat_${patientId}`;
}

function loadMessages(patientId: string): ChatMsg[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(getStorageKey(patientId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveMessages(patientId: string, messages: ChatMsg[]) {
    try {
        localStorage.setItem(getStorageKey(patientId), JSON.stringify(messages));
    } catch { /* storage full — silently ignore */ }
}

export function AIChatPanel({patient}: { patient: Patient }) {
    const [messages, setMessages] = useState<ChatMsg[]>(() => loadMessages(patient.id));
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Persist to localStorage
    useEffect(() => {
        saveMessages(patient.id, messages);
    }, [messages, patient.id]);

    const backendPatientId = patient.backendId;

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg: ChatMsg = {role: 'user', content: trimmed};
        const updated = [...messages, userMsg];
        setMessages(updated);
        setInput('');
        setError(null);
        setIsLoading(true);

        try {
            const res = await apiPost<{ role: string; content: string }>('/api/v1/chat', {
                patient_id: backendPatientId,
                messages: updated.map(m => ({role: m.role, content: m.content})),
            }, true);
            setMessages(prev => [...prev, {role: 'assistant', content: res.content}]);
        } catch (e: unknown) {
            const err = e as { message?: string };
            setError(err?.message || 'Failed to get AI response');
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClear = () => {
        setMessages([]);
        setError(null);
        localStorage.removeItem(getStorageKey(patient.id));
    };

    return (
        <Card className="flex flex-col" style={{height: '700px'}}>
            <CardHeader className="pb-2 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <Bot className="w-4 h-4 text-primary"/>
                        SepsisWatch Copilot
                    </CardTitle>
                    {messages.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3"/>
                            Clear
                        </button>
                    )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                    Ask about {patient.name}&apos;s condition, vitals, or sepsis risk.
                    Conversations are saved locally.
                </p>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 pb-3">
                {/* Messages area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1"
                >
                    {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <Bot className="w-10 h-10 text-muted-foreground/30 mb-3"/>
                            <p className="text-sm text-muted-foreground">
                                Start a conversation about this patient
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-3 justify-center max-w-sm">
                                {[
                                    'What does the current sepsis risk suggest?',
                                    'Summarize this patient\'s condition',
                                    'What should I monitor next?',
                                ].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => {
                                            setInput(q);
                                            inputRef.current?.focus();
                                        }}
                                        className="text-[10px] px-2 py-1 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={cn(
                                'flex',
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div
                                className={cn(
                                    'max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed',
                                    msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted border border-border'
                                )}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <Bot className="w-3 h-3 text-primary"/>
                                        <span className="text-[10px] font-medium text-primary">Copilot</span>
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-muted border border-border rounded-lg px-3 py-2">
                                <div className="flex items-center gap-1 mb-1">
                                    <Bot className="w-3 h-3 text-primary"/>
                                    <span className="text-[10px] font-medium text-primary">Copilot</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground"/>
                                    <span className="text-xs text-muted-foreground">Analyzing patient data…</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="text-[11px] text-critical bg-critical/10 border border-critical/20 rounded px-2 py-1.5 mb-2">
                        {error}
                    </div>
                )}

                {/* Input area */}
                <div className="flex items-end gap-2 shrink-0">
                    <Textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about this patient…"
                        rows={1}
                        className="resize-none text-xs min-h-[36px] max-h-[80px]"
                        disabled={isLoading}
                    />
                    <Button
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                    >
                        {isLoading
                            ? <Loader2 className="w-4 h-4 animate-spin"/>
                            : <Send className="w-4 h-4"/>
                        }
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}