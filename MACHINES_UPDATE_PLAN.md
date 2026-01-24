# Обновление базы данных бронетехники

## Статус: В процессе

## Выполнено:

### 1. Изображения переименованы ✅
Все 28 изображений бронетехники успешно переименованы в `public/images/machines/`:

**Протекторат (14 машин):**
- bronekhod.jpg (Бронеход)
- griffin.jpg (Грифон)
- werewolf.jpg (Вервольф)
- tornado.jpg (Торнадо)
- salamander.jpg (Саламандра)
- hurricane.jpg (Харрикейн)
- predator.jpg (Предатор)
- varan.jpg (Варан)
- carnivore.jpg (Карнивор)
- octopus.jpg (Спрут)
- trex.jpg (Ти-Рэкс)
- condor.jpg (Кондор)
- puma.jpg (Пума)
- viper.jpg (Вайпер)

**Полярис (14 машин):**
- raptor.jpg (Раптор)
- madbull.jpg (Мэд Булл)
- wildbear.jpg (Вайлд Беар)
- ravingbeast.jpg (Рэвинг Бист)
- thunder.jpg (Тандер)
- demolisher.jpg (Демолишер)
- eraser.jpg (Эрайзер)
- devastator.jpg (Девастатор)
- helix.jpg (Хеликс)
- spider.jpg (Спайдер)
- locust.jpg (Локуст)
- superlocust.jpg (Супер Локуст)
- hunter.jpg (Хантер)
- hornet.jpg (Хорнет)

**Дополнительные файлы:**
- temp1.jpg (маленькое изображение, возможно иконка)
- temp2.jpg (большое изображение, требует идентификации)

### 2. Типы обновлены ✅
В `src/lib/types.ts` добавлены новые поля для Machine:
- `description` - краткое описание (1-2 предложения)
- `sourceUrl` - ссылка на оригинальную статью

## Очередь работы:

### Задача 1: Обновить Protectors machines (в процессе)
Файл: `src/data/protectorate/machines.json`

Нужно добавить/обновить все 14 машин:
1. Бронеход - bronekhod.jpg
2. Грифон - griffin.jpg
3. Вервольф - werewolf.jpg
4. Торнадо - tornado.jpg
5. Саламандра - salamander.jpg
6. Харрикейн - hurricane.jpg
7. Предатор - predator.jpg
8. Варан - varan.jpg
9. Карнивор - carnivore.jpg
10. Спрут - octopus.jpg
11. Ти-Рэкс - trex.jpg
12. Кондор - condor.jpg
13. Пума - puma.jpg
14. Вайпер - viper.jpg

Для каждой машины добавить:
- `image` - путь к изображению
- `class` - класс техники
- `type` - тип машины
- `developer` - разработчик
- `description` - краткое описание (первое предложение из статьи)
- `sourceUrl` - "https://vk.com/@age_of_robogear-bronetehnika"
- Обновить оружия с полями `description` и `manufacturer`

### Задача 2: Создать Polaris machines
Файл: `src/data/polaris/machines.json`

Нужно добавить все 14 машин:
1. Раптор - raptor.jpg
2. Мэд Булл - madbull.jpg
3. Вайлд Беар - wildbear.jpg
4. Рэвинг Бист - ravingbeast.jpg
5. Тандер - thunder.jpg
6. Демолишер - demolisher.jpg
7. Эрайзер - eraser.jpg
8. Девастатор - devastator.jpg
9. Хеликс - helix.jpg
10. Спайдер - spider.jpg
11. Локуст - locust.jpg
12. Супер Локуст - superlocust.jpg
13. Хантер - hunter.jpg
14. Хорнет - hornet.jpg

Те же поля, что и для Protectors.

## Исходные данные:
**Источник:** https://vk.com/@age_of_robogear-bronetehnika

Извлечены полные данные для всех 28 машин:
- Класс и тип
- Разработчик
- Моноблок
- Масса и экипаж
- Вооружение с описаниями
- Полная история и лор

## Примечания:
- Краткое описание берётся как первое предложение из полного описания
- Ссылка на статью общая для всех машин
- Оружия требуют полей: `description` и `manufacturer`
