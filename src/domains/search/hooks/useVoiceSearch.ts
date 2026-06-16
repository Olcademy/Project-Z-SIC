import { useRef, useState, useCallback } from 'react';
import { Audio } from 'expo-av';

const ASSEMBLYAI_KEY = '32696d6bda7049a7bd042398b9e14432';

export const useVoiceSearch = (onResult: (text: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const recordingRef = useRef<Audio.Recording | null>(null);

    const startListening = useCallback(async () => {
        try {
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                alert('Microphone permission is required.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            recordingRef.current = recording;
            setIsListening(true);
        } catch (err) {
            console.error('Failed to start recording:', err);
            setIsListening(false);
        }
    }, []);

    const stopListening = useCallback(async () => {
        try {
            setIsListening(false);
            setIsProcessing(true);

            const recording = recordingRef.current;
            if (!recording) return;

            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

            const uri = recording.getURI();
            recordingRef.current = null;

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
    }, [onResult]);

    return { startListening, stopListening, isListening, isProcessing };
};