const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

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
    const { url, format } = req.body;

    if (!url || !format) {
        return res.status(400).json({ error: 'URL and format are required.' });
    }

    const id = Date.now();
    const outputPath = path.join(downloadsDir, `${id}.${format === 'audio' ? 'mp3' : 'mp4'}`);
    const outputTemplate = path.join(downloadsDir, `${id}`);

    try {
        // Check if we're using local yt-dlp.exe or system-installed yt-dlp
        const ytdlpPath = fs.existsSync(path.join(__dirname, 'yt-dlp.exe')) 
            ? path.join(__dirname, 'yt-dlp.exe')
            : 'yt-dlp';
        
        // Check for FFmpeg in common locations
        let ffmpegPath = '';
        const possibleFFmpegPaths = [
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
            path.join(__dirname, 'ffmpeg.exe')
        ];
        
        for (const possiblePath of possibleFFmpegPaths) {
            if (fs.existsSync(possiblePath)) {
                ffmpegPath = possiblePath;
                break;
            }
        }
        
        console.log(`Using yt-dlp from: ${ytdlpPath}`);
        console.log(`Using FFmpeg from: ${ffmpegPath || 'System PATH'}`);
        
        let command;
        if (format === 'audio') {
            command = `"${ytdlpPath}" -x --audio-format mp3`;
            
            // Add FFmpeg location if found
            if (ffmpegPath) {
                command += ` --ffmpeg-location "${path.dirname(ffmpegPath)}"`;
            }
            
            command += ` -o "${outputTemplate}.%(ext)s" ${url}`;
        } else {
            command = `"${ytdlpPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4"`;
            
            // Add FFmpeg location if found
            if (ffmpegPath) {
                command += ` --ffmpeg-location "${path.dirname(ffmpegPath)}"`;
            }
            
            command += ` -o "${outputTemplate}.%(ext)s" ${url}`;
        }
        
        console.log(`Executing command: ${command}`);
        
        const { stdout, stderr } = await execPromise(command);
        console.log('Download output:', stdout);
        
        if (stderr) {
            console.error('Download stderr:', stderr);
        }
        
        // Find the created file
        const files = fs.readdirSync(downloadsDir);
        const downloadedFile = files.find(file => file.startsWith(id.toString()));
        
        if (!downloadedFile) {
            throw new Error('Downloaded file not found');
        }
        
        const fileName = downloadedFile;
        res.json({ success: true, downloadUrl: `/downloads/${fileName}` });
    } catch (err) {
        console.error('Download failed:', err);
        res.status(500).json({ error: 'Download failed. ' + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});