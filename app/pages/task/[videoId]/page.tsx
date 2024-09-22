'use client';

import * as React from 'react';
import Typography from '@mui/material/Typography';
import { delay } from '@/app/lib/utils';
import CircularProgress from '@mui/material/CircularProgress';
import { useRef, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MicIcon from '@mui/icons-material/Mic';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FavoriteIcon from '@mui/icons-material/Favorite';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void; // Add this line
  }
}

interface Subtitle {
  id: number;
  text: string;
  startTime: number;
  duration: number;
}

export default function Page({ params }: { params: { videoId: string } }) {
  const [subtitles, setSubtitles] = React.useState<Subtitle[]>([]);
  // {
  //   "translate": "",
  //     "grammar": "",
  //       "example": [{ "sentence": "", "translate": "" }],
  //         "keyVocabulary": [{ "vocabulary": "", "illustrate": "" }]
  // }
  const [translation, setTranslation] = React.useState<{
    translate: string;
    grammar: string;
    example: { sentence: string, translate: string }[];
    keyVocabulary: { vocabulary: string, illustrate: string, pronounce: string, example: string }[];
  } | null>(null);
  // 被惦记的句子
  const [highlight, setHighlight] = React.useState<Subtitle | null>(null);
  const [translating, setTranslating] = React.useState<boolean>(false);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [recording, setRecording] = React.useState<boolean>(false);
  const [audioURL, setAudioURL] = React.useState<string | null>(null);
  const [isRecordingPlaying, setIsRecordingPlaying] = React.useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const playerRef = useRef<YT.Player | null>(null);
  // 定时请求接口/highlights?id=xxx
  useEffect(() => {
    // Load YouTube IFrame Player API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Create YouTube player
    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('video-container', {
        height: '400',
        width: '100%',
        videoId: params.videoId,
        events: {
          onReady: onPlayerReady,
        },
      });
    };

    function onPlayerReady(event: YT.PlayerEvent) {
      // Player is ready
      console.log('Player is ready', event);
    }

    return () => {
      // Cleanup
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [params.videoId]);

  // 播放
  const play = () => {
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  // 暂停
  const pause = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  };

  // 跳转到指定时间
  const seekTo = async (seekTime: number, duration?: number) => {
    play();
    if (playerRef.current) {
      playerRef.current.seekTo(seekTime, true);
      if (duration) {
        const delayTime = duration + (seekTime < seekTime ? (seekTime - seekTime) : 0);
        await delay(delayTime * 1000);
        pause();
      }
    }
  };

  let watchSubtitles = false;

  // 获取字幕信息
  // http://127.0.0.1:3000/api/get-subtitles?videoId=3uTmcG7CgdI
  React.useEffect(() => {
    if (watchSubtitles) {
      return;
    }
    watchSubtitles = true;
    getSubtitles();
  }, [params.videoId]);

  async function getSubtitles() {
    while (true) {
      console.log('获取字幕信息:', params.videoId);
      const res = await fetch(`/api/get-subtitles?videoId=${params.videoId}`);
      const data = await res.json();
      console.log('获取字幕信息:', data);
      if (data.subtitles.length > 0) {
        setSubtitles(data.subtitles);
        break;
      }
      await delay(5000);
    }
  }

  // 获取翻译信息
  // http://127.0.0.1:3000/api/translate?subtitle=
  async function getTranslation(subtitle: Subtitle) {
    seekTo(subtitle.startTime, subtitle.duration);
    setTranslating(true);
    setHighlight(subtitle);
    setTranslation(null);
    const res = await fetch(`/api/translate?subtitle=${encodeURIComponent(subtitle.text)}`);
    const data = await res.json();
    console.log('Translation:', data.translation);
    // Handle the translation data as needed
    setTranslation(data.translation);
    setTranslating(false);
  }

  function speakText(sub: Subtitle) {
    setIsPlaying(true);
    seekTo(sub.startTime, sub.duration).then(() => {
      setIsPlaying(false);
    });
  }

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const playRecording = () => {
    if (audioURL) {
      const audio = new Audio(audioURL);
      setIsRecordingPlaying(true);
      audio.play();
      audio.onended = () => {
        setIsRecordingPlaying(false);
      };
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <style jsx>{`
        .custom-scrollbar {
          /* Custom scrollbar styles */
          overflow-y: scroll;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
      `}</style>
      <div style={{ flex: 2, padding: '16px' }}>
        <div id="video-container" style={{ marginBottom: '16px' }}></div>
        {subtitles.length === 0 && (
          <Typography variant="h5" gutterBottom>
            get video subtitle....
          </Typography>
        )}
        <div style={{ height: '300px', overflowY: 'scroll', paddingTop: '16px', paddingBottom: '16px', paddingRight: '16px' }} className="custom-scrollbar">
          {subtitles.map(subtitle => (
            <Typography
              key={subtitle.id}
              variant="body1"
              display="inline"
              sx={{
                marginRight: '8px',
                paddingTop: '4px',
                paddingBottom: '4px',
                borderRadius: '4px',
                lineHeight: '2', // Adjust line height for larger spacing
                fontSize: '1.2rem',
                cursor: 'pointer', // Indicate clickable
                textDecoration: 'underline', // Add underline to indicate clickable
                textDecorationColor: 'rgba(0, 0, 0, 0.3)', // Use a subtle underline color
                textDecorationThickness: '1px', // Control the thickness of the underline
                textUnderlineOffset: '5px', // Control the distance of the underline from the text
                color: highlight?.id === subtitle.id ? 'pink' : 'inherit', // Change color if selected
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)', // Change background color on hover
                  textDecorationColor: 'rgba(0, 0, 0, 0.6)', // Darken underline on hover
                }
              }}
              onClick={() => getTranslation(subtitle)}
            >
              {subtitle.text}
            </Typography>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: '16px' }}>
        {!highlight ? (<Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1.1rem', color: '#555', marginBottom: '16px' }}>
          Click on a subtitle to analyze its grammar.
        </Typography>) : (
          <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', height: '720px', display: 'flex', flexDirection: 'column' }}>
            {/* 固定部分 */}
            <div style={{ marginBottom: '16px' }}>
              <Typography>
                <IconButton
                  onClick={() => speakText(highlight)}
                  aria-label="play"
                  sx={{
                    color: isPlaying ? 'pink' : 'inherit', // Change color when playing
                  }}
                >
                  <VolumeUpIcon />
                </IconButton>
                <IconButton
                  onClick={recording ? stopRecording : startRecording}
                  aria-label="record"
                  sx={{
                    color: recording ? 'pink' : 'inherit', // Change color when recording
                  }}
                >
                  <MicIcon />
                </IconButton>
                {audioURL && (
                  <IconButton
                    onClick={playRecording}
                    aria-label="play-recording"
                    sx={{
                      color: isRecordingPlaying ? 'pink' : 'inherit', // Change color when recording
                    }}
                  >
                    {isRecordingPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                )}
                {/* 在最右边加个收藏图标，点击后可以收藏字幕 */}
                {/* <IconButton
                  onClick={() => {
                    // 收藏字幕
                  }}
                  aria-label="favorite"
                  sx={{
                    color: 'inherit', // Change color when recording
                  }}
                >
                  <FavoriteIcon />
                </IconButton> */}
              </Typography>
              {/* 原文 */}
              <Typography variant="body1" component="h2" gutterBottom style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
                {highlight.text}
              </Typography>
              {/* 翻译 */}
              <Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1.1rem', color: '#555', marginBottom: '16px' }}>
                {translation?.translate || ''}
              </Typography>
            </div>
            {/* 可滚动部分 */}
            <div style={{ overflowY: 'scroll', flex: 1, paddingRight: '16px' }} className="custom-scrollbar">
              {translating ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '680px' }}>
                  <CircularProgress />
                </div>
              ) : (
                <div>
                  {translation && (
                    <div>
                      <div>
                        <Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1rem', fontWeight: 'bold', color: '#777', marginBottom: '8px' }}>
                          Grammar Analysis:
                        </Typography>
                        <Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1rem', color: '#777', marginBottom: '16px' }}>
                          {translation.grammar}
                        </Typography>
                      </div>

                      <div>
                        <Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1rem', fontWeight: 'bold', color: '#777', marginBottom: '8px' }}>
                          Example:
                        </Typography>
                        {translation.example.map(e => (
                          <div key={e.sentence}>
                            <Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1rem', color: '#777', marginBottom: '16px' }}>
                              {e.sentence}
                            </Typography>
                            <Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1rem', color: '#777', marginBottom: '16px' }}>
                              {e.translate}
                            </Typography>
                          </div>
                        ))}
                      </div>

                      <div>
                        <Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1rem', fontWeight: 'bold', color: '#777', marginBottom: '8px' }}>
                          Key Vocabulary:
                        </Typography>
                        {translation.keyVocabulary.map(e => (
                          <div key={e.vocabulary} style={{ marginBottom: '24px' }}>
                            <Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1rem', color: '#777', marginBottom: '8px' }}>
                              {e.vocabulary}
                            </Typography>
                            {/* 发音， pronounce */}
                            <Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1rem', color: '#777' }}>
                              {e.pronounce || ''}
                            </Typography>
                            {/* 解释， illustrate */}
                            <Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1rem', color: '#777' }}>
                              {e.illustrate}
                            </Typography>
                            {/* 例句， example */}
                            <Typography variant="body1" component="p" gutterBottom style={{ fontSize: '1rem', color: '#777' }}>
                              {e.example || ''}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
