const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
}

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve downloads folder statically
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

app.post('/api/download', async (req, res) => {
    let { url, format } = req.body;

    if (!url || !format) {
        return res.status(400).json({ error: 'URL and format are required.' });
    }

    // ✅ Clean the URL (remove ?si=... and other params)
    url = url.split('&')[0].split('?')[0];

    const id = Date.now();
    const outputPath = path.join(downloadsDir, `${id}.${format === 'audio' ? 'mp3' : 'mp4'}`);
    const outputTemplate = path.join(downloadsDir, `${id}.%(ext)s`);

    try {
        const options = {
            output: outputTemplate,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
        };

        if (format === 'audio') {
            options.extractAudio = true;
            options.audioFormat = 'mp3';
        } else {
            options.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4';
        }

        console.log('Downloading:', url);
        await ytdlp(url, options);

        // Find the created file
        const files = fs.readdirSync(downloadsDir);
        const downloadedFile = files.find(file => file.startsWith(id.toString()));

        if (!downloadedFile) {
            throw new Error('Downloaded file not found');
        }

        res.json({ success: true, downloadUrl: `/downloads/${downloadedFile}` });
    } catch (err) {
        console.error('Download failed:', err);
        res.status(500).json({ error: 'Download failed. ' + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
