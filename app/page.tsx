'use client';

import * as React from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import { green } from '@mui/material/colors';
import Icon from '@mui/material/Icon';
import FormHelperText from '@mui/material/FormHelperText';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

export default function Page() {
  // input绑定拉流地址
  const [videoUrl, setVideoUrl] = React.useState('');
  const [error, setError] = React.useState('');
  const [videoList, setVideoList] = React.useState<{
    id: string;
    title: string;
    thumbnailUrl: string;
  }[]>([]);

  React.useEffect(() => {
    fetch('/api/video-list').then(res => res.json()).then(json => {
      setVideoList(json.videos);
    });
  }, []);

  async function handleClickAddBtn() {
    const checkResult = checkUrl(videoUrl);
    if (!checkResult) {
      return;
    }
    console.log({ videoUrl });
    // get videoId from videoUrl from youtube
    const videoId = videoUrl.split('v=')[1];
    const data = await fetch(`/api/add-video?videoId=${videoId}`);
    const json = await data.json();
    console.log('请求成功：', json);
    window.open(`/pages/task/${videoId}`);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    // Example of URL validation (adjust the regex according to your needs)
    const checkResult = checkUrl(value);

    if (!checkResult) {
      setError('input youtube video url');
    } else {
      setError('');
    }
    setVideoUrl(value);
  }

  function checkUrl(url: string) {
    const urlPattern = /^(ftp|http|https):\/\/[^ "]+$/;
    return urlPattern.test(url);
  }
  return (
    <div>
      <Paper
        component="form"
        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400 }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="input youtube video url"
          inputProps={{ 'aria-label': 'input youtube video url' }}
          value={videoUrl}
          onChange={handleInputChange}
          error={Boolean(error)}
        />
        <IconButton color="primary" sx={{ p: '10px' }} aria-label="directions" onClick={handleClickAddBtn}>
          <Icon sx={{ color: green[500] }}>+</Icon>
        </IconButton>
      </Paper>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
        {videoList.map(video => (
          <Card
            key={video.id}
            sx={{ maxWidth: 345, flex: '1 1 calc(20% - 16px)', marginBottom: 2 }}
            onClick={() => window.open(`/pages/task/${video.id}`, '_blank')}
            style={{ cursor: 'pointer' }}
          >
            <CardMedia
              component="img"
              height="140"
              image={video.thumbnailUrl}
              alt={video.title}
            />
            <CardContent>
              <Typography gutterBottom variant="h6" component="div">
                {video.title}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </div>
      {error && (
        <FormHelperText error>{error}</FormHelperText>
      )}
    </div>
  );
}
