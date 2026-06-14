import { useGlobalState } from '../context/GlobalContext';

export const useTheme = () => {
  const { state, setState } = useGlobalState();

  const toggleTheme = () => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  return { theme: state.theme, toggleTheme };
};
