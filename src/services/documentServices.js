import apiClient from '../api/index';

export const documentService = {
    getMine: async () => (await apiClient.get('/documents/me')).data,
    getMyRequests: async () => (await apiClient.get('/documents/requests/me')).data,
    // Employee asks HR for a document (COE, ITR copy, …).
    createRequest: async (payload) => (await apiClient.post('/documents/requests/me', payload)).data,
    cancelRequest: async (id) => (await apiClient.patch(`/documents/requests/me/${id}/cancel`)).data,
    // `payload` is a FormData built by buildDocumentForm() — the file is uploaded
    // to S3 by the backend, which stores its object key and returns a presigned
    // `file_url` on every read.
    upload: async (formData) => (await apiClient.post('/documents/me', formData)).data,
    update: async (id, formData) => (await apiClient.put(`/documents/me/${id}`, formData)).data,
    remove: async (id) => (await apiClient.delete(`/documents/me/${id}`)).data,
};

/**
 * Build the multipart payload the documents API expects.
 * @param {{ label?: string, file?: File, documentRequestId?: string|number }} opts
 */
export const buildDocumentForm = ({ label, file, documentRequestId } = {}) => {
    const fd = new FormData();
    if (label != null) fd.append('label', label);
    if (documentRequestId) fd.append('document_request_id', documentRequestId);
    if (file) fd.append('file', file);
    return fd;
};

export const MAX_DOC_BYTES = 4 * 1024 * 1024;
