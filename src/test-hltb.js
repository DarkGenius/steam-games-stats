const { getGameCompletionTime } = require('./api/hltb');

async function test() {
    try {
        const gameName = 'Cyberpunk 2077';
        console.log(`Searching for completion time for: ${gameName}`);
        
        const result = await getGameCompletionTime(gameName);
        console.log('Results:');
        console.log('Main Story:', result.mainStory);
        console.log('Main + Extras:', result.mainPlusExtras);
        console.log('Completionist:', result.completionist);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test(); 