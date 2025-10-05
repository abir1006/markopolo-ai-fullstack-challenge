import React, {useState, useEffect, useRef} from 'react';
import {Send, Database, MessageSquare, Zap, Check, Play, Settings} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const App = () => {
    const [dataSources, setDataSources] = useState([]);
    const [channels, setChannels] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentRecommendations, setCurrentRecommendations] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchDataSources();
        fetchChannels();

        setMessages([{
            id: 1,
            type: 'assistant',
            content: 'Welcome to your Marketing Campaign AI! Connect your data sources and enable channels to get started.',
            timestamp: new Date()
        }]);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const fetchDataSources = async () => {
        try {
            const response = await fetch(`${API_BASE}/data-sources`);
            const data = await response.json();

            // normalize boolean
            const normalized = data.map(item => ({
                ...item,
                connected: !!item.connected
            }));

            setDataSources(normalized);
        } catch (error) {
            console.error('Error fetching data sources:', error);
        }
    };

    const fetchChannels = async () => {
        try {
            const response = await fetch(`${API_BASE}/channels`);
            const data = await response.json();

            const normalized = data.map(item => ({
                ...item,
                enabled: !!item.enabled
            }));

            setChannels(normalized);
        } catch (error) {
            console.error('Error fetching channels:', error);
        }
    };


    const toggleDataSource = async (source) => {
        try {
            const endpoint = source.connected ? 'disconnect' : 'connect';
            const response = await fetch(`${API_BASE}/data-sources/${source.type}/${endpoint}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
            });

            if (response.ok) {
                fetchDataSources();
                addMessage('system', `${source.connected ? '❌ Disconnected' : '✅ Connected'} ${source.name}`);
            }
        } catch (error) {
            console.error('Error toggling data source:', error);
            addMessage('system', `❌ Failed to ${source.connected ? 'disconnect' : 'connect'} ${source.name}`);
        }
    };

    const toggleChannel = async (channel) => {
        try {
            const endpoint = channel.enabled ? 'disable' : 'enable';
            const response = await fetch(`${API_BASE}/channels/${channel.type}/${endpoint}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
            });

            if (response.ok) {
                fetchChannels();
                addMessage('system', `${channel.enabled ? '❌ Disabled' : '✅ Enabled'} ${channel.name} channel`);
            }
        } catch (error) {
            console.error('Error toggling channel:', error);
            addMessage('system', `❌ Failed to ${channel.enabled ? 'disable' : 'enable'} ${channel.name} channel`);
        }
    };

    const addMessage = (type, content, data = null) => {
        const newMessage = {
            id: Date.now() + Math.random(),
            type,
            content,
            data,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const connectedSources = dataSources.filter(ds => ds.connected).map(ds => ds.type);
        const enabledChannels = channels.filter(ch => ch.enabled).map(ch => ch.type);

        if (connectedSources.length === 0) {
            addMessage('system', '⚠️ Please connect at least one data source first.');
            return;
        }

        if (enabledChannels.length === 0) {
            addMessage('system', '⚠️ Please enable at least one channel first.');
            return;
        }

        addMessage('user', inputMessage);
        setInputMessage('');
        setIsStreaming(true);
        setCurrentRecommendations([]);

        try {
            const response = await fetch(`${API_BASE}/chat/stream`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    message: inputMessage,
                    data_sources: connectedSources,
                    channels: enabledChannels
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            setIsStreaming(false);
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === 'status') {
                                addMessage('assistant', `🔄 ${parsed.message}`);
                            } else if (parsed.type === 'recommendation') {
                                setCurrentRecommendations(prev => [...prev, parsed.data]);
                                addMessage('recommendation', 'New campaign recommendation generated', parsed.data);
                            } else if (parsed.type === 'summary') {
                                addMessage('assistant', `✅ ${parsed.message}`);
                            }
                        } catch (e) {
                            console.error('Error parsing stream data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addMessage('system', '❌ Error generating recommendations. Please try again.');
        } finally {
            setIsStreaming(false);
        }
    };

    const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleTimeString();

    const RecommendationCard = ({recommendation}) => (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        recommendation.channel === 'email' ? 'bg-green-100 text-green-800' :
                            recommendation.channel === 'sms' ? 'bg-blue-100 text-blue-800' :
                                recommendation.channel === 'push' ? 'bg-purple-100 text-purple-800' :
                                    'bg-pink-100 text-pink-800'
                    }`}>
                        {recommendation.channel.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">
                        Confidence: {recommendation.confidence_score}%
                    </div>
                </div>
                <button
                    onClick={() => executeCampaign(recommendation.campaign_id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                >
                    <Play size={14}/>
                    <span>Execute</span>
                </button>
            </div>
            <div className="mb-2">
                <h4 className="font-semibold text-gray-800">Target Audience</h4>
                <p className="text-sm text-gray-600">{recommendation.audience_segment}</p>
            </div>
            <div className="mb-2">
                <h4 className="font-semibold text-gray-800">Message</h4>
                <p className="text-sm text-gray-700 bg-white p-2 rounded border">{recommendation.message}</p>
            </div>
            <div className="mb-3">
                <h4 className="font-semibold text-gray-800">Timing</h4>
                <p className="text-sm text-gray-600">{recommendation.timing}</p>
            </div>
            {recommendation.data_insights && (
                <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">View Data Insights</summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
            {JSON.stringify(recommendation.data_insights, null, 2)}
          </pre>
                </details>
            )}
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                        <Settings size={20}/>
                        <span>Configuration</span>
                    </h2>
                </div>

                {/* Data Sources */}
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center space-x-2">
                        <Database size={16}/>
                        <span>Data Sources</span>
                    </h3>
                    {dataSources.map((source) => (
                        <label key={source.type}
                               className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded cursor-pointer">
                            <span className="text-sm text-gray-700">{source.name}</span>
                            <input
                                type="checkbox"
                                checked={source.connected || false}
                                onChange={() => toggleDataSource(source)}
                            />
                        </label>
                    ))}
                </div>

                {/* Channels */}
                <div className="p-4">
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center space-x-2">
                        <Zap size={16}/>
                        <span>Channels</span>
                    </h3>
                    {channels.map((channel) => (
                        <label key={channel.type}
                               className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded cursor-pointer">
                            <span className="text-sm text-gray-700">{channel.name}</span>
                            <input
                                type="checkbox"
                                checked={channel.enabled || false}
                                onChange={() => toggleChannel(channel)}
                            />
                        </label>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <h1 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                        <MessageSquare size={24}/>
                        <span>Marketing Campaign AI</span>
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Ask me to generate campaign recommendations based on your connected data sources
                    </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message) => (
                        <div key={message.id}
                             className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-3xl p-3 rounded-lg ${
                                message.type === 'user' ? 'bg-blue-600 text-white' :
                                    message.type === 'system' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                        message.type === 'recommendation' ? 'bg-transparent p-0' :
                                            'bg-gray-100 text-gray-800'
                            }`}>
                                {message.type === 'recommendation' ? (
                                    <RecommendationCard recommendation={message.data}/>
                                ) : (
                                    <>
                                        <div className="text-sm">{message.content}</div>
                                        <div className="text-xs opacity-70 mt-1">
                                            {formatTimestamp(message.timestamp)}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {isStreaming && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-sm">Generating recommendations...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef}/>
                </div>

                {/* Input */}
                <div className="bg-white border-t border-gray-200 p-4">
                    <div className="flex space-x-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask for campaign recommendations..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isStreaming}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isStreaming || !inputMessage.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                        >
                            <Send size={16}/>
                            <span>Send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
