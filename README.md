# Тусовка

Сервіс подій з обмеженою кількістю місць: реєстрація, публічні та приватні тусовки, RSVP «Іду», коментарі.

Час зберігається в UTC і показується за київським поясом (`Europe/Kyiv`).

## Швидкий старт

Потрібні Node.js 20.9+ і npm.

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000).

Опційно заповніть демо-дані:

```bash
npm run db:seed
```

Демо-акаунти (лише для локальної перевірки):

- `olena@example.com` / `correcthorsebatterystaple`
- `maksym@example.com` / `correcthorsebatterystaple`

## Змінні середовища

Див. `.env.example`.

| Змінна | Призначення |
| --- | --- |
| `DATABASE_URL` | SQLite. Шлях відносно каталогу `prisma/` |
| `SESSION_COOKIE_SECURE` | `true` на HTTPS, щоб cookie отримала `Secure` |
| `APP_ORIGIN` | Публічний origin (посилання-запрошення й перевірка Origin) |

Файл `.env` не комітиться. У production (`NODE_ENV=production`) сесійна cookie ставиться з `Secure`, якщо не вимкнути це явно.

## Тести

Одна команда, не лише щасливий шлях (IDOR, XSS, overbook, приватні події):

```bash
npm test
```

## Продакшен

```bash
cp .env.example .env
# відредагуйте APP_ORIGIN і SESSION_COOKIE_SECURE=true
npm install
npm run build
npm start
```

Обкладинки лежать у `data/uploads/`. Каталог `data/` у git не зберігає БД і завантажені файли.

## Можливості

1. Реєстрація / вхід / вихід (email + пароль).
2. Створення події: назва, опис, дата й час, місця, обкладинка, публічна/приватна.
3. Головна: майбутні публічні події, пошук за назвою (без урахування регістру, зокрема кирилиця).
4. Сторінка події: «Іду» / «Скасувати», лічильник місць, коментарі.
5. Автор редагує й видаляє свою подію, бачить список учасників (з email).
6. Приватні події — лише за невгадуваним посиланням `/i/<token>`.
7. Профіль: створені мною + ті, на які я записався.

## Безпека (коротко)

- Параметризований Prisma/SQL, без конкатенації запитів
- Коментарі й тексти як plain text (React екранує HTML), CSP + security headers
- Авторизація кожної мутації на сервері
- Приватні події: випадковий invite-token, 404 для чужих ID
- Місткість у атомарному `INSERT … SELECT`, унікальність `(eventId, userId)`
- Argon2id, нормалізація email, однакова помилка логіну, rate limit
- Завантаження: magic bytes, ліміт 2 МБ, без SVG/HTML, випадкове імʼя
- CSRF: SameSite=Lax + перевірка Origin, httpOnly session cookie
- Немає секретів у репозиторії
