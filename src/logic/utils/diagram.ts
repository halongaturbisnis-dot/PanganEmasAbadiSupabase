import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

/**
 * Utility to render mermaid diagrams to HTML or SVG
 */
export const renderDiagram = async (id: string, definition: string): Promise<{ svg: string }> => {
  try {
    const { svg } = await mermaid.render(id, definition);
    return { svg };
  } catch (error) {
    console.error('Mermaid rendering failed:', error);
    throw error;
  }
};

/**
 * Component-like utility to handle mermaid lifecycle in React
 */
export const initializeMermaid = () => {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
  });
};
