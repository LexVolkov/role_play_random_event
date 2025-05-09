

export function getSetting<T = string>(settings: any[], settingName: string): T | null {
    const setting = settings.find((s) => s.name === settingName);

    if (!setting) {
        console.error(`Не можу завантажити налаштування ${settingName}`);
        throw new Error(`Не можу завантажити налаштування ${settingName}`);
    }

    try {
        // Определяем тип и конвертируем значение
        if (typeof setting.value === "string") {
            if (!isNaN(Number(setting.value))) return Number(setting.value) as T; // Число
            if (setting.value.toLowerCase() === "true") return true as T; // Булево true
            if (setting.value.toLowerCase() === "false") return false as T; // Булево false
        }
        return setting.value as T; // Оставляем строку или другие типы
    } catch (error) {
        console.error(`Помилка при конвертації налаштування ${settingName}:`, error);
        throw new Error(`Помилка при конвертації налаштування ${settingName}:`);
    }
}