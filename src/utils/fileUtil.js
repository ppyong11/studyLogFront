// 파일 확장자 관련 유틸리티
export const FileUtil = {
    // 서버에서 정의한 블랙리스트와 동일하게 구성
    blackExts: new Set([
        "exe", "msi", "bat", "cmd", "sh", "bin", "com", "cpl", "scr", "jar",
        "js", "jsp", "php", "asp", "aspx", "cgi", "pl", "py", "rb",
        "dll", "sys", "so", "drv", "vxd", "ocx",
        "pif", "vbs", "vbe", "wsf", "wsh", "ps1",
        "html", "htm", "xml", "svg"
    ]),

    // 이미지 확장자 목록
    imageExts: new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp"]),

    getExtension: (fileName) => fileName.split('.').pop().toLowerCase(),

    isBlacklisted: (fileName) => {
        const ext = FileUtil.getExtension(fileName);
        return FileUtil.blackExts.has(ext);
    },

    isImage: (fileName) => {
        const ext = FileUtil.getExtension(fileName);
        return FileUtil.imageExts.has(ext);
    }
};