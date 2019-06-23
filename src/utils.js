
/**
 * @param {string} a
 * @param {string} b
 * @return {number}
 */
export function levenshteinDistance(a, b) {
    // Create empty edit distance matrix for all possible modifications of
    // substrings of a to substrings of b.
    const distanceMatrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
    // Fill the first row of the matrix.
    // If this is first row then we're transforming empty string to a.
    // In this case the number of transformations equals to size of a substring.
    for (let i = 0; i <= a.length; i += 1) {
      distanceMatrix[0][i] = i;
    }
  
    // Fill the first column of the matrix.
    // If this is first column then we're transforming empty string to b.
    // In this case the number of transformations equals to size of b substring.
    for (let j = 0; j <= b.length; j += 1) {
      distanceMatrix[j][0] = j;
    }
  
    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        distanceMatrix[j][i] = Math.min(
          distanceMatrix[j][i - 1] + 1, // deletion
          distanceMatrix[j - 1][i] + 1, // insertion
          distanceMatrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
  
    return distanceMatrix[b.length][a.length];
  }


  export function damerauLevensteing (source, target) {
    if (!source) return target ? target.length : 0;
    else if (!target) return source.length;

    var m = source.length, n = target.length, INF = m+n, score = new Array(m+2), sd = {};
    for (var i = 0; i < m+2; i++) score[i] = new Array(n+2);
    score[0][0] = INF;
    for (var i = 0; i <= m; i++) {
        score[i+1][1] = i;
        score[i+1][0] = INF;
        sd[source[i]] = 0;
    }
    for (var j = 0; j <= n; j++) {
        score[1][j+1] = j;
        score[0][j+1] = INF;
        sd[target[j]] = 0;
    }

    for (var i = 1; i <= m; i++) {
        var DB = 0;
        for (var j = 1; j <= n; j++) {
            var i1 = sd[target[j-1]],
                j1 = DB;
            if (source[i-1] === target[j-1]) {
                score[i+1][j+1] = score[i][j];
                DB = j;
            }
            else {
                score[i+1][j+1] = Math.min(score[i][j], Math.min(score[i+1][j], score[i][j+1])) + 1;
            }
            score[i+1][j+1] = Math.min(score[i+1][j+1], score[i1] ? score[i1][j1] + (i-i1-1) + 1 + (j-j1-1) : Infinity);
        }
        sd[source[i-1]] = i;
    }
    return score[m+1][n+1];
  }

  export function segmentedDistance(a,b,splitChar){
    let oVal=0;
    for (let i=0;i<a.split(splitChar).length;i++){
        oVal+=levenshteinDistance(a.split(splitChar)[i],b);
        console.log({segment:levenshteinDistance(a.split(splitChar)[i],b)
          ,from:a.split(splitChar)[i]
        ,to:b});
    }
    return oVal;
  }

  function extend(a, b) {
    for (var property in b) {
      if (b.hasOwnProperty(property)) {
        a[property] = b[property];
      }
    }

    return a;
  }


  export function jarowinklerDistance(s1,s2,options){

      var m = 0;
      var defaults = { caseSensitive: true };
      var settings = extend(defaults, options);
      var i;
      var j;
  
      // Exit early if either are empty.
      if (s1.length === 0 || s2.length === 0) {
        return 0;
      }
  
      // Convert to upper if case-sensitive is false.
      if (!settings.caseSensitive) {
        s1 = s1.toUpperCase();
        s2 = s2.toUpperCase();
      }
  
      // Exit early if they're an exact match.
      if (s1 === s2) {
        return 1;
      }
  
      var range = (Math.floor(Math.max(s1.length, s2.length) / 2)) - 1;
      var s1Matches = new Array(s1.length);
      var s2Matches = new Array(s2.length);
  
      for (i = 0; i < s1.length; i++) {
        var low  = (i >= range) ? i - range : 0;
        var high = (i + range <= (s2.length - 1)) ? (i + range) : (s2.length - 1);
  
        for (j = low; j <= high; j++) {
          if (s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j]) {
            ++m;
            s1Matches[i] = s2Matches[j] = true;
            break;
          }
        }
      }
  
      // Exit early if no matches were found.
      if (m === 0) {
        return 0;
      }
  
      // Count the transpositions.
      var k = 0;
      var numTrans = 0;
  
      for (i = 0; i < s1.length; i++) {
        if (s1Matches[i] === true) {
          for (j = k; j < s2.length; j++) {
            if (s2Matches[j] === true) {
              k = j + 1;
              break;
            }
          }
  
          if (s1[i] !== s2[j]) {
            ++numTrans;
          }
        }
      }
  
      var weight = (m / s1.length + m / s2.length + (m - (numTrans / 2)) / m) / 3;
      var l = 0;
      var p = 0.1;
  
      if (weight > 0.7) {
        while (s1[l] === s2[l] && l < 4) {
          ++l;
        }
  
        weight = weight + l * p * (1 - weight);
      }
  
      return weight;
    }