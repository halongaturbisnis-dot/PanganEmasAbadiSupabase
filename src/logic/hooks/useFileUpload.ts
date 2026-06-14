import { useState, useCallback } from 'react';
import { storageService } from '../services/storage';
import { processBatchUpload } from '../services/fileService';

/**
 * HOOKS/USEFILEUPLOAD.TS
 * Specialized hook for managing file upload lifecycles, progress, and states.
 */

interface UploadState {
  progress: number;
  isUploading: boolean;
  error: string | null;
  url: string | null;
}

export const useFileUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    isUploading: false,
    error: null,
    url: null,
  });

  const upload = useCallback(async (file: File) => {
    setUploadState({ progress: 10, isUploading: true, error: null, url: null });

    try {
      const result = await storageService.upload(file);
      
      setUploadState(prev => ({ ...prev, isUploading: false, progress: 100, url: result.url }));
      return result.url;
    } catch (err) {
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        error: err instanceof Error ? err.message : 'Upload failed' 
      }));
      throw err;
    }
  }, []);

  const uploadBatch = useCallback(async (files: File[], parallel = true) => {
    setUploadState({ progress: 0, isUploading: true, error: null, url: null });
    
    try {
      const results = await processBatchUpload(files, parallel);
      setUploadState(prev => ({ ...prev, isUploading: false, progress: 100 }));
      return results;
    } catch (err) {
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        error: err instanceof Error ? err.message : 'Batch upload failed' 
      }));
      throw err;
    }
  }, []);

  return {
    ...uploadState,
    upload,
    uploadBatch,
    reset: () => setUploadState({ progress: 0, isUploading: false, error: null, url: null })
  };
};
