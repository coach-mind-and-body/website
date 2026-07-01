import sys
import wave

import numpy as np
import whisper

audio_path = sys.argv[1]

with wave.open(audio_path, "rb") as wf:
    audio = (
        np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16)
        .astype(np.float32)
        / 32768.0
    )

model = whisper.load_model("base")
result = model.transcribe(audio)
print("FULL TEXT:")
print(result["text"].strip())
print("\nSEGMENTS:")
for s in result["segments"]:
    print(f"{s['start']:.1f}-{s['end']:.1f}: {s['text'].strip()}")