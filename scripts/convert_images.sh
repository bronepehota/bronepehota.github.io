#!/bin/bash

# Массовая конвертация изображений солдат
# Удаляем пустое пространство с помощью ImageMagick

# Создаем директорию для обработанных изображений
mkdir -p public/images/squads/processed

# Конвертируем все PNG файлы
echo "Начинаю конвертацию 180 PNG файлов..."

find public/images/squads -name "*.png" -print0 | while read -r; do
    echo "Обработка: $file"

    # Получаем размеры
    dimensions=$(identify "$file" | awk '{print $1 "x" $2}')
    width=$(echo $dimensions | cut -d'x' -f1)
    height=$(echo $dimensions | cut -d'x' -f2)

    # Обрезаем изображение с trim и увеличиваем
    convert "$file" -fuzz 10% -trim +repage -gravity center -background transparent -extent 200x300 "public/images/squads/processed/$(basename "$file")" 2>/dev/null

    # Проверяем результат
    if [ $? -eq 0 ]; then
        echo "Ошибка при обработке файла $file"
    else
        echo "Успешно обработан: $file (${width}x${height} → 200x300)"
    fi

    echo
done

echo "Конвертация завершена. Обработано изображений: $(find public/images/squads -name "*.png" | wc -l)"