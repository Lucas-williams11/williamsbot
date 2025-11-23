
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getChatStream } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    
    // Naive markdown to HTML conversion
    const formatText = (text: string) => {
        let formattedText = text;
        // Bold
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italics
        formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Lists
        formattedText = formattedText.replace(/^\s*\*\s(.*)/gm, '<li class="ml-4">$1</li>');
        formattedText = formattedText.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        
        return formattedText.replace(/\n/g, '<br />');
    };

    return (
        <div className={`flex items-start gap-3 my-4 ${isModel ? '' : 'flex-row-reverse'}`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isModel ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                {isModel ? 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> : 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                }
            </div>
            <div className={`p-4 rounded-lg max-w-lg ${isModel ? 'bg-slate-800 text-slate-200' : 'bg-cyan-600 text-white'}`}
                 dangerouslySetInnerHTML={{ __html: formatText(message.parts[0].text) }}>
            </div>
        </div>
    );
};

export const ChatConsultant: React.FC = () => {
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', parts: [{ text: t('chatConsultant.initialMessage') }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);
    
    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        // Add user message and a placeholder for the model's response
        setMessages(prev => [...prev, newUserMessage, { role: 'model', parts: [{ text: '...' }] }]);
        
        try {
            const history = messages.slice(1, messages.length); // Exclude the initial message
            const stream = await getChatStream(history, currentInput, language);
            
            let fullResponse = "";
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                fullResponse += chunkText;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: fullResponse }] };
                    return newMessages;
                });
            }

        } catch (e) {
            console.error(e);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: t('chatConsultant.errorMessage') }] };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input, isLoading, messages, t, language]);


    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto bg-slate-800/50 border border-slate-700 rounded-lg shadow-2xl">
            <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto">
                {messages.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                ))}
                {isLoading && messages[messages.length-1].role === 'model' && messages[messages.length-1].parts[0].text === '...' && (
                     <div className="flex items-start gap-3 my-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-cyan-500">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="p-4 rounded-lg max-w-lg bg-slate-800 text-slate-200">
                           <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                           </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-slate-700">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={t('chatConsultant.placeholder')}
                        className="flex-grow bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-3"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
