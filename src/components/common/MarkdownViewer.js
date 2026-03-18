"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// 테마 색상
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'; 

const MarkdownViewer = ({ content }) => {
    if (!content) return null;

    return (
        <div className="prose prose-sm sm:prose-base max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        
                        // 인라인 코드 구분
                        const isInline = inline || (!codeString.includes('\n') && !match);

                        if (!isInline) {
                            // 여러 줄 코드 블록
                            return (
                                <SyntaxHighlighter
                                    style={oneLight}
                                    language={match ? match[1] : 'text'} 
                                    PreTag="span" 
                                    className="block overflow-x-auto rounded-md text-sm my-4" 
                                    {...props}
                                >
                                    {codeString}
                                </SyntaxHighlighter>
                            );
                        }

                        // 단일 줄 인라인 코드 (회색 배경 + 빨간 글씨)
                        return (
                            <code 
                                className="bg-gray-100 text-red-500 px-1.5 py-0.5 mx-0.5 rounded-md text-[0.9em] font-mono before:content-none after:content-none" 
                                {...props}
                            >
                                {codeString}
                            </code>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownViewer;