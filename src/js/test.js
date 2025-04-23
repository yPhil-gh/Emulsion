// Include all the original functions
function cleanFileName(fileName) {
  // 1) Drop everything after the first underscore
  let s = _removeAfterUnderscore(fileName);

  // 2) Handle special digit+upper (e.g. "3DWorld" → "3D World")
  s = _splitSpecial(s);

  // 3) Split camelCase (e.g. "simpleName" → "simple Name")
  s = _splitCamelCase(s);

  // 4) Split acronyms from following words (e.g. "XMLHttp" → "XML Http")
  s = _splitAcronym(s);

  // 5) Strip parentheses and brackets
  s = _removeParens(s);
  s = _removeBrackets(s);

  // 6) Move trailing ", The" (or similar) to the front
  s = _moveTrailingArticleToFront(s);

  // 7) Finally, title-case each word (but keep ALL-CAP words intact)
  return _titleCase(s);
}


function _removeAfterUnderscore(s) {
  return s.split('_')[0];
}

function _splitSpecial(s) {
  return s.replace(/(\d+[A-Z])(?=[A-Z][a-z])/g, '$1 ');
}

function _splitCamelCase(s) {
  return s.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function _splitAcronym(s) {
  return s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function _removeParens(s) {
  return s.replace(/\s*\(.*?\)/g, '');
}

function _removeBrackets(s) {
  return s.replace(/\s*\[.*?\]/g, '');
}

function _moveTrailingArticleToFront(s) {
  // Matches "... , The" (case-insensitive), end of string
  const m = s.match(/^(.*?),\s*(The|An|A)$/i);
  if (m) {
    // Capitalize the article properly and prepend
    const art = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
    return `${art} ${m[1].trim()}`;
  }
  return s;
}

function _titleCase(s) {
  return s
    .split(/\s+/)
    .map(word => {
      // If it's all digits or ALL-CAP (or contains digits), leave as-is
      if (/^[0-9]+$/.test(word) || /^[A-Z0-9]+$/.test(word)) {
        return word;
      }
      // Otherwise, uppercase first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// Test function
function testCleanFileName() {
  const testCases = [
    // Basic cases
    { input: 'simpleName', expected: 'Simple Name' },
    { input: 'AnotherName', expected: 'Another Name' },

    // Underscore cases
    { input: 'before_after', expected: 'before' },
    { input: 'only_underscore_', expected: 'only' },

    // CamelCase cases
    { input: 'camelCaseName', expected: 'camel Case Name' },
    { input: 'XMLHttpRequest', expected: 'XML Http Request' },

    // Special number cases
    { input: '3DWorld', expected: '3D World' },
    { input: '4KVideo', expected: '4K Video' },
    { input: '1080pVideo', expected: '1080p Video' },

    // Acronym cases
    { input: 'JSONData', expected: 'JSON Data' },
    { input: 'CSVFile', expected: 'CSV File' },

    // Article cases
    { input: 'Matrix, The', expected: 'The Matrix' },
    { input: 'Godfather, The', expected: 'The Godfather' },

    // Parentheses and brackets
    { input: 'Movie (2023)', expected: 'Movie' },
    { input: 'Show [Remastered]', expected: 'Show' },

    // Combined cases
    { input: 'TheDarkKnight_2008[IMAX]', expected: 'The Dark Knight' },
    { input: '3DMovie_4K(TheBest)', expected: '3D Movie' },

      // Last case
    { input: 'Lucky Dime Caper Starring Donald Duck, The (Europe, Brazil) (En)', expected: 'The Lucky Dime Caper Starring Donald Duck' }


  ];

  console.log('Running tests...\n');
  let passed = 0;

  testCases.forEach((test, index) => {
    const result = cleanFileName(test.input);
    if (result === test.expected) {
      console.log(`✓ Test ${index + 1} passed: "${test.input}" → "${result}"`);
      passed++;
    } else {
      console.error(`✗ Test ${index + 1} failed: "${test.input}"`);
      console.error(`   Expected: "${test.expected}"`);
      console.error(`   Got:      "${result}"\n`);
    }
  });

  console.log(`\nResults: ${passed}/${testCases.length} tests passed`);
  console.log(passed === testCases.length ? '🎉 All tests passed!' : '⚠️  Some tests failed');
}

// Run the tests
testCleanFileName();
