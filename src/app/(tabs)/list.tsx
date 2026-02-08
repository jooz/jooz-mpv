import React from 'react';
import { Text, View } from 'react-native';

export default function ListScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
            <Text className="text-slate-900 dark:text-white text-lg font-bold">Lista de Compras</Text>
        </View>
    );
}
