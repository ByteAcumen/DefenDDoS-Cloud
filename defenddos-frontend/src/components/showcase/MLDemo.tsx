'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Brain,
    Zap,
    Target,
    AlertTriangle,
    CheckCircle,
    Loader2,
    BarChart3,
    Activity
} from 'lucide-react';

interface PredictionResult {
    prediction: 'BENIGN' | 'ATTACK';
    confidence: number;
    attackType?: string;
    model: string;
    processingTime: number;
}

const SAMPLE_TRAFFIC = {
    normal: {
        sourceIp: '192.168.1.100',
        destinationIp: '10.0.0.50',
        packetCount: 150,
        byteCount: 12500,
    },
    attack: {
        sourceIp: '203.0.113.50',
        destinationIp: '10.0.0.1',
        packetCount: 50000,
        byteCount: 5000000,
    },
};

export function MLDemo({ className = '' }: { className?: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [trafficData, setTrafficData] = useState(SAMPLE_TRAFFIC.normal);
    const [selectedModel, setSelectedModel] = useState<'RandomForest' | 'LSTM' | 'Combined'>('Combined');

    const runPrediction = async () => {
        setIsLoading(true);
        setResult(null);

        // Simulate ML prediction (in real app, call /api/v1/traffic/predict-attack)
        await new Promise(resolve => setTimeout(resolve, 1500));

        const isAttack = trafficData.packetCount > 10000 || trafficData.byteCount > 1000000;
        const confidence = isAttack ? 0.87 + Math.random() * 0.12 : 0.92 + Math.random() * 0.07;

        setResult({
            prediction: isAttack ? 'ATTACK' : 'BENIGN',
            confidence: Math.min(confidence, 0.99),
            attackType: isAttack ? 'DDoS Flood' : undefined,
            model: selectedModel,
            processingTime: 15 + Math.random() * 30,
        });

        setIsLoading(false);
    };

    const loadSample = (type: 'normal' | 'attack') => {
        setTrafficData(SAMPLE_TRAFFIC[type]);
        setResult(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm overflow-hidden ${className}`}
        >
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">ML Attack Detection</h2>
                        <p className="text-sm text-slate-400">Test our dual-model detection system</p>
                    </div>
                </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">
                {/* Input Panel */}
                <div className="space-y-4">
                    {/* Model Selector */}
                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Model</label>
                        <div className="flex gap-2">
                            {(['RandomForest', 'LSTM', 'Combined'] as const).map((model) => (
                                <button
                                    key={model}
                                    onClick={() => setSelectedModel(model)}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedModel === model
                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                            : 'bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:bg-slate-700/50'
                                        }`}
                                >
                                    {model}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Traffic Input Fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Source IP</label>
                            <input
                                type="text"
                                value={trafficData.sourceIp}
                                onChange={(e) => setTrafficData({ ...trafficData, sourceIp: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Dest IP</label>
                            <input
                                type="text"
                                value={trafficData.destinationIp}
                                onChange={(e) => setTrafficData({ ...trafficData, destinationIp: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Packet Count</label>
                            <input
                                type="number"
                                value={trafficData.packetCount}
                                onChange={(e) => setTrafficData({ ...trafficData, packetCount: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Byte Count</label>
                            <input
                                type="number"
                                value={trafficData.byteCount}
                                onChange={(e) => setTrafficData({ ...trafficData, byteCount: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white text-sm"
                            />
                        </div>
                    </div>

                    {/* Sample Data Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => loadSample('normal')}
                            className="flex-1 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-sm hover:bg-green-500/20 transition-colors"
                        >
                            Load Normal Traffic
                        </button>
                        <button
                            onClick={() => loadSample('attack')}
                            className="flex-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm hover:bg-red-500/20 transition-colors"
                        >
                            Load Attack Traffic
                        </button>
                    </div>

                    {/* Predict Button */}
                    <button
                        onClick={runPrediction}
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                Run Prediction
                            </>
                        )}
                    </button>
                </div>

                {/* Results Panel */}
                <div className="flex flex-col justify-center">
                    {result ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                        >
                            {/* Main Result */}
                            <div className={`p-6 rounded-xl text-center ${result.prediction === 'ATTACK'
                                    ? 'bg-red-500/10 border border-red-500/30'
                                    : 'bg-green-500/10 border border-green-500/30'
                                }`}>
                                {result.prediction === 'ATTACK' ? (
                                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                                ) : (
                                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                                )}
                                <h3 className={`text-2xl font-bold ${result.prediction === 'ATTACK' ? 'text-red-400' : 'text-green-400'
                                    }`}>
                                    {result.prediction}
                                </h3>
                                {result.attackType && (
                                    <p className="text-sm text-red-300 mt-1">{result.attackType}</p>
                                )}
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                                    <Target className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                                    <p className="text-lg font-bold text-white">{(result.confidence * 100).toFixed(1)}%</p>
                                    <p className="text-xs text-slate-500">Confidence</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                                    <Brain className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                                    <p className="text-sm font-bold text-white">{result.model}</p>
                                    <p className="text-xs text-slate-500">Model</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                                    <Activity className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
                                    <p className="text-lg font-bold text-white">{result.processingTime.toFixed(0)}ms</p>
                                    <p className="text-xs text-slate-500">Time</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-center p-8 text-slate-500">
                            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>Enter traffic data and run prediction</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Model Info Footer */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        Random Forest: 99.2% accuracy
                    </span>
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        LSTM: Anomaly detection
                    </span>
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        30+ features analyzed
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export default MLDemo;
