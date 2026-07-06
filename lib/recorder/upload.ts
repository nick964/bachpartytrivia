"use client";

/**
 * Uploads a recorded blob straight to a Cloudflare Stream direct creator
 * upload URL (multipart POST) with progress. Video bytes never touch our
 * servers.
 */
export function uploadToStream(
  uploadURL: string,
  blob: Blob,
  onProgress: (fraction: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadURL);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your signal."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    const ext = blob.type.includes("mp4") ? "mp4" : "webm";
    const form = new FormData();
    form.append("file", blob, `answer.${ext}`);
    xhr.send(form);
  });
}
