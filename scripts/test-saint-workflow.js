import readline from 'readline';
import { promisify } from 'util';

const BASE_URL = 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  try {
    console.log('=== Saint Search and Association Workflow Test ===\n');

    // Step 1: Prompt for saint name
    const saintName = await ask('Enter a saint name to search: ');
    if (!saintName.trim()) {
      console.log('No name entered. Exiting.');
      rl.close();
      return;
    }

    // Step 2: Search for saints
    console.log('\nSearching for saints...');
    const saints = await fetchJson(`${BASE_URL}/api/saints?search=${encodeURIComponent(saintName.trim())}`);

    if (!saints || saints.length === 0) {
      console.log('No saints found matching the search term.');
      rl.close();
      return;
    }

    // Step 3: Display matching saints and allow selection
    console.log('\nMatching saints:');
    saints.forEach((saint, index) => {
      console.log(`${index + 1}. ${saint.name} (${saint.saintName || 'N/A'}) - ${saint.location?.displayName || 'No location'}`);
    });

    const selectionInput = await ask('\nSelect a saint (enter number): ');
    const selection = parseInt(selectionInput);
    if (isNaN(selection) || selection < 1 || selection > saints.length) {
      console.log('Invalid selection. Exiting.');
      rl.close();
      return;
    }

    const selectedSaint = saints[selection - 1];
    console.log(`\nSelected: ${selectedSaint.name}`);

    // Step 4: Get full saint details
    console.log('\nFetching full saint details...');
    const fullSaint = await fetchJson(`${BASE_URL}/api/saints?id=${selectedSaint.id}`);

    // Step 5: Show locations associated with the saint
    console.log('\nLocations associated with the saint:');
    if (fullSaint.location) {
      console.log(`- ${fullSaint.location.displayName} (${fullSaint.location.city}, ${fullSaint.location.state})`);
    } else {
      console.log('- No location associated');
    }

    // Step 6: Show years that saint has historical and milestone events for
    console.log('\nYears with historical and milestone events:');
    const years = new Set();
    if (fullSaint.years) {
      fullSaint.years.forEach(year => years.add(year.saintYear));
    }
    if (fullSaint.events) {
      fullSaint.events.forEach(event => {
        if (event.year) years.add(event.year);
      });
    }
    const sortedYears = Array.from(years).sort((a, b) => a - b);
    if (sortedYears.length > 0) {
      console.log(sortedYears.join(', '));
    } else {
      console.log('No years found');
    }

    // Step 7: Display available milestones
    console.log('\nFetching milestones...');
    const milestones = await fetchJson(`${BASE_URL}/api/saints/${selectedSaint.id}/milestones`);

    if (!milestones || milestones.length === 0) {
      console.log('No milestones found for this saint.');
      rl.close();
      return;
    }

    // Correlate milestones with milestone objects for sticker information
    console.log('\nAvailable milestones:');
    milestones.forEach((milestone, index) => {
      // Parse count from milestone string (format: "X beers on YYYY-MM-DD")
      const countMatch = milestone.match(/^(\d+) beers on/);
      const count = countMatch ? parseInt(countMatch[1]) : null;
      const dateMatch = milestone.match(/on (\d{4}-\d{2}-\d{2})$/);
      const date = dateMatch ? dateMatch[1] : null;

      // Find corresponding milestone object
      const correspondingMilestone = count && date ? fullSaint.milestones.find(m =>
        m.count === count && m.date === date
      ) : null;

      // Determine sticker information
      let stickerInfo = '';
      if (correspondingMilestone && correspondingMilestone.sticker) {
        stickerInfo = ` - Sticker assigned: ${correspondingMilestone.sticker}`;
      } else {
        stickerInfo = ' - Sticker assigned: No';
      }

      console.log(`${index + 1}. ${milestone}${stickerInfo}`);
    });

    // Step 8: Allow selection of a milestone
    const milestoneSelectionInput = await ask('\nSelect a milestone (enter number): ');
    const milestoneSelection = parseInt(milestoneSelectionInput);
    if (isNaN(milestoneSelection) || milestoneSelection < 1 || milestoneSelection > milestones.length) {
      console.log('Invalid selection. Exiting.');
      rl.close();
      return;
    }

    const selectedMilestone = milestones[milestoneSelection - 1];

    // Step 9: Show summary
    console.log('\n=== SUMMARY ===');
    console.log(`Saint: ${fullSaint.name} (${fullSaint.saintName || 'N/A'})`);
    console.log(`Location: ${fullSaint.location ? fullSaint.location.displayName : 'None'}`);
    console.log(`Years: ${sortedYears.length > 0 ? sortedYears.join(', ') : 'None'}`);
    console.log(`Selected Milestone: ${selectedMilestone}`);
    console.log('\nWorkflow completed successfully!');

  } catch (error) {
    console.error('An error occurred:', error.message);
  } finally {
    rl.close();
  }
}

main();