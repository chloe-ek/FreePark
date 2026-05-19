import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface State { hasError: boolean }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.sub}>Please restart the app.</Text>
        <TouchableOpacity onPress={() => this.setState({ hasError: false })} style={styles.btn}>
          <Text style={styles.btnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  title:     { fontSize: 17, fontWeight: '600', color: '#111', marginBottom: 8 },
  sub:       { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
  btn:       { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: '#22c55e' },
  btnText:   { fontSize: 14, fontWeight: '600', color: '#fff' },
});
