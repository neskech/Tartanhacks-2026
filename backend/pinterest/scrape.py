from xmlrpc.client import MAXINT
from pinterest_dl import PinterestDL
import os

def main(BOARD: str):
    if BOARD == 'character-art':
        BOARD_URL = f"https://www.pinterest.com/dsyang04/{BOARD}/"
    else:
        BOARD_URL = f"https://www.pinterest.com/neskechastro/{BOARD}/"

    OUTPUT_FOLDER = f"./downloaded_pins/{BOARD}"

    # Create folder if it doesn't exist
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)

    if len(os.listdir(OUTPUT_FOLDER)) > 1:
        print(f"Skipping {BOARD} : Images have already been scraped")
        return

    print(f"Starting download from: {BOARD_URL}")
    # Initialize and run the Pinterest image downloader with specified settings
    PinterestDL.with_api(
        timeout=5000,  # Timeout in seconds for each request (default: 3)
        verbose=True,  # Enable detailed logging for debugging (default: False)
    ).scrape_and_download(
        url=BOARD_URL,  # Pinterest URL to scrape
        output_dir=OUTPUT_FOLDER,  # Directory to save downloaded images
        num=MAXINT,  # Max number of images to download 
        delay=1.0,  # Delay between requests (default: 0.2)
    )
        
    print(f"Done! Check the '{OUTPUT_FOLDER}' directory.")

# 1. Configuration

BOARDS = [
    'draw-ref',
    'dragon-ball',
    'pose-reference',
    'gesture',
    'situational-anatomy',
    'anatomy-reference',
    'character-art'
]
SELECTED_BOARDS = [
     'draw-ref',
    'dragon-ball',
    'pose-reference',
    'gesture',
    'situational-anatomy',
    'anatomy-reference',
    'character-art'
]


if __name__ == "__main__":
    for BOARD in SELECTED_BOARDS:
        main(BOARD)