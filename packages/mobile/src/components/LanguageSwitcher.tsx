import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n';

const Flag = ({ code, flag }: { code: string; flag: string }) => {
  const useTaiwanOverride = process.env.EXPO_PUBLIC_TAIWAN === 'TAIWAN';

  if (code === 'zh-TW' && useTaiwanOverride) {
    return <Text className="text-xs font-bold text-gray-600 tracking-tighter">TW</Text>;
  }
  
  return <Text className="text-base leading-none">{flag}</Text>;
};

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(false);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  function handleSelect(code: LanguageCode) {
    i18n.changeLanguage(code);
    setVisible(false);
  }

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className="flex-row items-center bg-gray-100 px-4 py-2.5 rounded-lg"
        accessibilityLabel="Change language"
      >
        <View className="flex-row items-center space-x-2">
          <View className="w-6 items-center justify-center">
            <Flag code={currentLang.code} flag={currentLang.flag} />
          </View>
          <Text className="text-gray-700 text-sm font-medium ml-2">{currentLang.name}</Text>
        </View>
        <Text className="text-gray-400 ml-2">{'\u25BE'}</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setVisible(false)}>
          <View className="bg-white rounded-t-2xl px-4 py-6">
            <Text className="text-lg font-bold text-gray-900 mb-4 text-center">Select Language</Text>
            <FlatList
              data={SUPPORTED_LANGUAGES as unknown as typeof SUPPORTED_LANGUAGES[number][]}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item.code as LanguageCode)}
                  className={`flex-row items-center justify-between py-3.5 px-4 rounded-lg ${
                    item.code === i18n.language ? 'bg-primary-50' : ''
                  }`}
                >
                  <View className="flex-row items-center space-x-3">
                    <View className="w-6 items-center justify-center">
                      <Flag code={item.code} flag={item.flag} />
                    </View>
                    <Text className={`text-base ml-3 ${item.code === i18n.language ? 'text-primary-700 font-semibold' : 'text-gray-700'}`}>
                      {item.name}
                    </Text>
                  </View>
                  {item.code === i18n.language && (
                    <Text className="text-primary-600 font-bold">{'\u2713'}</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
