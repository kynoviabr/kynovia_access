"use client";

import { useState } from "react";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(bytes / 1024, 1).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContractUploadField() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div className="contract-upload-field">
      <label>
        Upload do contrato
        <input
          accept=".pdf,.doc,.docx,image/png,image/jpeg"
          name="contract_file"
          type="file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
      </label>
      {selectedFile ? (
        <div className="selected-file-card" aria-live="polite">
          <strong>{selectedFile.name}</strong>
          <span>{formatFileSize(selectedFile.size)}</span>
        </div>
      ) : (
        <p className="input-help">Selecione PDF, DOC, DOCX, PNG ou JPG do contrato.</p>
      )}
      <p className="input-help">
        Nesta etapa o arquivo fica apenas selecionado no navegador. O envio persistente para
        Storage sera ativado em uma etapa segura posterior.
      </p>
    </div>
  );
}
