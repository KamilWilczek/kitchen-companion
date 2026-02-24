import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useDebounce } from 'hooks/useDebounce';
import { useSuggestionsApi } from 'api/suggestions';
import { s } from './AutocompleteInput.styles';

type Props = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (text: string) => void;
  debounceMs?: number;
  maxSuggestions?: number;
  style?: StyleProp<ViewStyle>;
};

export function AutocompleteInput({
  value,
  onChangeText,
  debounceMs = 300,
  maxSuggestions = 8,
  style,
  editable,
  ...textInputProps
}: Props) {
  const suggestionsApi = useSuggestionsApi();
  const apiRef = useRef(suggestionsApi);
  apiRef.current = suggestionsApi;

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputHeight, setInputHeight] = useState(38);
  const [isFocused, setIsFocused] = useState(false);

  const debouncedValue = useDebounce(value, debounceMs);

  useEffect(() => {
    if (editable === false || !isFocused) {
      setSuggestions([]);
      return;
    }
    if (debouncedValue.length >= 2) {
      apiRef.current
        .getSuggestions(debouncedValue)
        .then((results) => setSuggestions(results.slice(0, maxSuggestions)))
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  }, [debouncedValue, editable, isFocused, maxSuggestions]);

  const handleSelect = useCallback(
    (suggestion: string) => {
      onChangeText(suggestion);
      setSuggestions([]);
    },
    [onChangeText],
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setTimeout(() => setSuggestions([]), 150);
  }, []);

  return (
    <View style={[s.container, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onLayout={(e) => setInputHeight(e.nativeEvent.layout.height)}
        editable={editable}
        style={s.input}
        {...textInputProps}
      />
      {suggestions.length > 0 && (
        <View style={[s.dropdown, { top: inputHeight }]}>
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              style={s.suggestionRow}
              onPress={() => handleSelect(suggestion)}
            >
              <Text style={s.suggestionText}>{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
