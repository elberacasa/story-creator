export function generateImagePrompt(story, theme, age) {
  const shortSummary = story.split('.')[0]; // Get the first sentence
  return `Create a child-friendly illustration for a ${age}-year-old's story book, based on the following scene: ${shortSummary}. The overall theme is ${theme}. The style should be colorful, engaging, and suitable for young children. IMPORTANT: Do not include any text, words, or letters in the image. The illustration should be purely visual without any written elements.`;
}