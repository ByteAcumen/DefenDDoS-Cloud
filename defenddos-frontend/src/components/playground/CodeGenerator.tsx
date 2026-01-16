'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Code } from 'lucide-react';

interface RequestConfig {
    method: string;
    endpoint: string;
    headers: { key: string; value: string; enabled: boolean }[];
    body?: string;
}

interface CodeGeneratorProps {
    request: RequestConfig;
    baseUrl?: string;
    className?: string;
}

type Language = 'curl' | 'python' | 'javascript' | 'java';

const LANGUAGES: { id: Language; label: string; icon: string }[] = [
    { id: 'curl', label: 'cURL', icon: '🔧' },
    { id: 'python', label: 'Python', icon: '🐍' },
    { id: 'javascript', label: 'JavaScript', icon: '🟨' },
    { id: 'java', label: 'Java', icon: '☕' },
];

function generateCurl(request: RequestConfig, baseUrl: string): string {
    const headers = request.headers
        .filter(h => h.enabled && h.key)
        .map(h => `  -H '${h.key}: ${h.value}'`)
        .join(' \\\n');

    let code = `curl -X ${request.method} '${baseUrl}${request.endpoint}'`;
    if (headers) code += ` \\\n${headers}`;
    if (['POST', 'PUT'].includes(request.method) && request.body) {
        code += ` \\\n  -d '${request.body.replace(/\n/g, '').replace(/'/g, "\\'")}'`;
    }
    return code;
}

function generatePython(request: RequestConfig, baseUrl: string): string {
    const headers = request.headers
        .filter(h => h.enabled && h.key)
        .map(h => `    "${h.key}": "${h.value}"`)
        .join(',\n');

    let code = `import requests

url = "${baseUrl}${request.endpoint}"
headers = {
${headers}
}
`;

    if (['POST', 'PUT'].includes(request.method) && request.body) {
        code += `
payload = ${request.body}

response = requests.${request.method.toLowerCase()}(url, json=payload, headers=headers)`;
    } else {
        code += `
response = requests.${request.method.toLowerCase()}(url, headers=headers)`;
    }

    code += `
print(response.status_code)
print(response.json())`;

    return code;
}

function generateJavaScript(request: RequestConfig, baseUrl: string): string {
    const headers = request.headers
        .filter(h => h.enabled && h.key)
        .map(h => `    '${h.key}': '${h.value}'`)
        .join(',\n');

    let fetchOptions = `{
  method: '${request.method}',
  headers: {
${headers}
  }`;

    if (['POST', 'PUT'].includes(request.method) && request.body) {
        fetchOptions += `,
  body: JSON.stringify(${request.body})`;
    }
    fetchOptions += '\n}';

    return `const response = await fetch('${baseUrl}${request.endpoint}', ${fetchOptions});

const data = await response.json();
console.log(data);`;
}

function generateJava(request: RequestConfig, baseUrl: string): string {
    const headers = request.headers
        .filter(h => h.enabled && h.key)
        .map(h => `.header("${h.key}", "${h.value}")`)
        .join('\n            ');

    let code = `import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${baseUrl}${request.endpoint}"))
    .method("${request.method}", `;

    if (['POST', 'PUT'].includes(request.method) && request.body) {
        code += `HttpRequest.BodyPublishers.ofString("""
        ${request.body}
        """))`;
    } else {
        code += `HttpRequest.BodyPublishers.noBody())`;
    }

    code += `
    ${headers}
    .build();

HttpResponse<String> response = client.send(request, 
    HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`;

    return code;
}

// Syntax highlighting for code
function highlightCode(code: string, language: Language): React.ReactElement[] {
    const lines = code.split('\n');

    return lines.map((line, i) => {
        let highlighted = line;

        // Common patterns
        highlighted = highlighted
            // Strings
            .replace(/'([^']*)'/g, '<span class="text-green-400">\'$1\'</span>')
            .replace(/"([^"]*)"/g, '<span class="text-green-400">"$1"</span>')
            // Keywords
            .replace(/\b(import|from|const|let|var|async|await|return|if|else)\b/g, '<span class="text-purple-400">$1</span>')
            // Functions/methods
            .replace(/\b(fetch|print|println|requests|send|json|newBuilder|build)\b/g, '<span class="text-cyan-400">$1</span>')
            // Comments
            .replace(/(\/\/.*)$/g, '<span class="text-slate-500">$1</span>')
            .replace(/(#.*)$/g, '<span class="text-slate-500">$1</span>');

        return (
            <div key={i} className="flex">
                <span className="text-slate-600 select-none w-8 text-right pr-4">{i + 1}</span>
                <span dangerouslySetInnerHTML={{ __html: highlighted }} />
            </div>
        );
    });
}

export function CodeGenerator({ request, baseUrl = 'http://localhost:8081', className = '' }: CodeGeneratorProps) {
    const [language, setLanguage] = useState<Language>('curl');
    const [copied, setCopied] = useState(false);

    const code = useMemo(() => {
        switch (language) {
            case 'curl': return generateCurl(request, baseUrl);
            case 'python': return generatePython(request, baseUrl);
            case 'javascript': return generateJavaScript(request, baseUrl);
            case 'java': return generateJava(request, baseUrl);
            default: return '';
        }
    }, [request, baseUrl, language]);

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm overflow-hidden ${className}`}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <Code className="w-4 h-4 text-cyan-400" />
                    </div>
                    <h3 className="text-sm font-medium text-white">Code Snippet</h3>
                </div>

                <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                        </>
                    )}
                </button>
            </div>

            {/* Language Tabs */}
            <div className="flex border-b border-slate-700/50 overflow-x-auto">
                {LANGUAGES.map(({ id, label, icon }) => (
                    <button
                        key={id}
                        onClick={() => setLanguage(id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${language === id
                                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <span>{icon}</span>
                        {label}
                    </button>
                ))}
            </div>

            {/* Code Display */}
            <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-sm leading-relaxed text-slate-300">
                    {highlightCode(code, language)}
                </pre>
            </div>
        </motion.div>
    );
}

export default CodeGenerator;
