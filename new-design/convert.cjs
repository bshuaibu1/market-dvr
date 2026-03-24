const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));

function processFile(file) {
  let content = fs.readFileSync(path.join(__dirname, file), 'utf-8');
  
  // 1. Extract styles
  const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
  let cssContent = '';
  if (styleMatch) {
    cssContent = styleMatch[1].trim();
    content = content.replace(/<style>[\s\S]*?<\/style>/, '');
  }
  
  // 2. Extract body
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let tsxContent = '';
  if (bodyMatch) {
    tsxContent = bodyMatch[1].trim();
  } else {
    tsxContent = content; // Fallback
  }

  // 3. Fix standard HTML props to JSX props
  tsxContent = tsxContent.replace(/class=/g, 'className=');
  tsxContent = tsxContent.replace(/for=/g, 'htmlFor=');
  tsxContent = tsxContent.replace(/onclick=/g, 'onClick=');
  tsxContent = tsxContent.replace(/oninput=/g, 'onInput=');
  tsxContent = tsxContent.replace(/onchange=/g, 'onChange=');
  tsxContent = tsxContent.replace(/onmouseover=/g, 'onMouseOver=');
  tsxContent = tsxContent.replace(/onmouseout=/g, 'onMouseOut=');
  tsxContent = tsxContent.replace(/stroke-width=/g, 'strokeWidth=');
  tsxContent = tsxContent.replace(/stroke-linecap=/g, 'strokeLinecap=');
  tsxContent = tsxContent.replace(/stroke-linejoin=/g, 'strokeLinejoin=');
  tsxContent = tsxContent.replace(/stroke-dasharray=/g, 'strokeDasharray=');
  tsxContent = tsxContent.replace(/stroke-dashoffset=/g, 'strokeDashoffset=');
  tsxContent = tsxContent.replace(/fill-rule=/g, 'fillRule=');
  tsxContent = tsxContent.replace(/clip-rule=/g, 'clipRule=');
  tsxContent = tsxContent.replace(/viewbox=/gi, 'viewBox=');
  tsxContent = tsxContent.replace(/preserveaspectratio=/gi, 'preserveAspectRatio=');
  
  // 4. Close unclosed tags
  tsxContent = tsxContent.replace(/<(input[^>]*[^\/])>/g, '<$1 />');
  tsxContent = tsxContent.replace(/<(hr[^>]*[^\/])>/g, '<$1 />');
  tsxContent = tsxContent.replace(/<(img[^>]*[^\/])>/g, '<$1 />');
  tsxContent = tsxContent.replace(/<(br[^>]*[^\/])>/g, '<$1 />');
  
  // 5. Transform style="xxx: yyy" to style={{xxx: 'yyy'}}
  tsxContent = tsxContent.replace(/style="([^"]*)"/g, (match, p1) => {
    const rules = p1.split(';').filter(Boolean);
    const reactStyles = rules.map(rule => {
      const parts = rule.split(':');
      if (parts.length < 2) return '';
      let [key, ...val] = parts;
      key = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      return `${key}: '${val.join(':').trim().replace(/'/g, "\\'")}'`;
    }).filter(Boolean).join(', ');
    return `style={{${reactStyles}}}`;
  });

  // 6. Comment out scripts and mock blocks conceptually
  tsxContent = tsxContent.replace(/<script>([\s\S]*?)<\/script>/, (match, JS) => {
    return '{\n  /* TODO: Move this logic to a React Effect or Helper */\n  /*\n' + JS + '\n  */\n}';
  });
  
  // Handle HTML comments
  tsxContent = tsxContent.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

  // Wrap in a Functional Component
  const tsxName = file.charAt(0).toUpperCase() + file.slice(1, -5) + 'View';
  const outFileNameTSX = file.charAt(0).toUpperCase() + file.slice(1, -5) + '.tsx';
  const outFileNameCSS = file.slice(0, -5) + '.css';
  
  const finalTSX = `import React from 'react';
import './${outFileNameCSS}';

export default function ${tsxName}() {
  return (
    <>
      ${tsxContent}
    </>
  );
}
`;

  fs.writeFileSync(path.join(__dirname, outFileNameCSS), cssContent, 'utf-8');
  fs.writeFileSync(path.join(__dirname, outFileNameTSX), finalTSX, 'utf-8');
  console.log(`Converted ${file} to ${outFileNameTSX} & ${outFileNameCSS}`);
}

files.forEach(processFile);
console.log('All files converted!');
