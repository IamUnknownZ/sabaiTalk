import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

type Coordinates = { latitude: number; longitude: number };

type State = {
  loading: boolean;
  granted: boolean | null;
  error: string | null;
  latitude: number | null;
  longitude: number | null;
};

const initialState: State = {
  loading: false,
  granted: null,
  error: null,
  latitude: null,
  longitude: null,
};

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Location request timed out. Retry or continue without location.')), milliseconds);
    }),
  ]);
}

export function useCurrentLocation() {
  const [state, setState] = useState<State>(initialState);

  const request = useCallback(async (): Promise<Coordinates | null> => {
    setState((current) => ({ ...current, loading: true, error: null }));
    const timeout = Platform.OS === 'web' ? 8000 : 15000;

    try {
      const permission = await withTimeout(Location.requestForegroundPermissionsAsync(), timeout);
      if (permission.status !== 'granted') {
        setState({ ...initialState, granted: false, error: 'Location permission was not granted.' });
        return null;
      }

      const position = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        timeout,
      );
      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setState({
        loading: false,
        granted: true,
        error: null,
        ...coordinates,
      });

      return coordinates;
    } catch (error) {
      setState({
        ...initialState,
        granted: false,
        error: error instanceof Error ? error.message : 'Could not read your location.',
      });
      return null;
    }
  }, []);

  return { ...state, request };
}
