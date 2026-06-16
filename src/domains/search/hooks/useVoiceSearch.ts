import { useState, useCallback, useEffect } from 'react';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';

const ASSEMBLYAI_KEY = '32696d6bda7049a7bd042398b9e14432';

export const useVoiceSearch = (onResult: (text: string) => void) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(audioRecorder);

    useEffect(() => {
        (async () => {
            const status = await AudioModule.requestRecordingPermissionsAsync();
            if (!status.granted) {
                alert('Microphone permission is required.');
            }

            await setAudioModeAsync({
                playsInSilentMode: true,
                allowsRecording: true,
            });
        })();
    }, []);

    const startListening = useCallback(async () => {
        try {
            await audioRecorder.prepareToRecordAsync();
            audioRecorder.record();
        } catch (err) {
            console.error('Failed to start recording:', err);
        }
    }, [audioRecorder]);

    const stopListening = useCallback(async () => {
        try {
            setIsProcessing(true);
            await audioRecorder.stop();

            const uri = audioRecorder.uri;
            if (!uri) return;

            // Step 1: Upload audio to AssemblyAI
            const audioData = await fetch(uri);
            const audioBlob = await audioData.blob();

            const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
                method: 'POST',
                headers: {
                    authorization: ASSEMBLYAI_KEY,
                    'Content-Type': 'application/octet-stream',
                },
                body: audioBlob,
            });

            const { upload_url } = await uploadRes.json();

            // Step 2: Request transcription
            const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
                method: 'POST',
                headers: {
                    authorization: ASSEMBLYAI_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ audio_url: upload_url }),
            });

            const { id } = await transcriptRes.json();

            // Step 3: Poll until transcription is done
            while (true) {
                await new Promise((r) => setTimeout(r, 1500));

                const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                    headers: { authorization: ASSEMBLYAI_KEY },
                });

                const data = await pollRes.json();

                if (data.status === 'completed') {
                    if (data.text) onResult(data.text.trim());
                    break;
                } else if (data.status === 'error') {
                    console.error('Please try again. Transcription failed:', data.error);
                    break;
                }
            }
        } catch (err) {
            console.error('Voice search error:', err);
        } finally {
            setIsProcessing(false);
        }
    }, [audioRecorder, onResult]);

    return { startListening, stopListening, isListening: recorderState.isRecording, isProcessing };
};