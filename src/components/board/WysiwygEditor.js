'use client';

import { useRef } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

export default function WysiwygEditor({ content, onChange, onImageUpload }) {
    const editorRef = useRef();

    const handleChange = () => {
        if (editorRef.current) {
            const markdownData = editorRef.current.getInstance().getMarkdown();
            onChange(markdownData);
        }
    };

    return (
        <div className="bg-white">
            <Editor
                ref={editorRef}
                initialValue={content || " "} // 빈 값일 때 에러 방지를 위해 공백 하나 넣어줌
                initialEditType="wysiwyg"
                previewStyle="vertical"
                height="450px"
                useCommandShortcut={true}
                onChange={handleChange}
                toolbarItems={[
                    ['heading', 'bold', 'italic', 'strike'],
                    ['hr', 'quote'],
                    ['ul', 'ol', 'task', 'indent', 'outdent'],
                    ['table', 'link'],
                    ['code', 'codeblock'],
                ]}

                // 이미지가 들어오면 가로채서 백엔드로 보내는 훅
                hooks={{
                    addImageBlobHook: (blob, callback) => {
                        onImageUpload(blob, callback);
                        return false; // 기본 이미지 삽입 동작(Base64)을 막음
                    }
                }}
            />
        </div>
    );
}