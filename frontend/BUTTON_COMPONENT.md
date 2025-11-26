# Button Component Documentation

## Overview
Красивый, современный компонент кнопки с множеством вариантов стилей, анимациями и поддержкой состояния загрузки.

## Использование

```tsx
import Button from '../components/Button';

// Базовое использование
<Button variant="primary">Click Me</Button>

// С иконкой
<Button variant="success" icon={<span>🚭</span>}>
  Start Now
</Button>

// С состоянием загрузки
<Button variant="primary" loading={isLoading}>
  Save
</Button>

// Полная ширина
<Button variant="primary" fullWidth>
  Submit
</Button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'success' \| 'danger' \| 'outline' \| 'ghost' \| 'purple' \| 'gradient'` | `'primary'` | Вариант стиля кнопки |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер кнопки |
| `fullWidth` | `boolean` | `false` | Растянуть кнопку на всю ширину |
| `icon` | `ReactNode` | - | Иконка для отображения перед текстом |
| `loading` | `boolean` | `false` | Показать индикатор загрузки |
| `disabled` | `boolean` | `false` | Отключить кнопку |
| `children` | `ReactNode` | - | Содержимое кнопки (обязательно) |

Также поддерживает все стандартные HTML атрибуты кнопки (`onClick`, `type`, `style`, и т.д.)

## Варианты (Variants)

### Primary (по умолчанию)
Синий градиент - основная кнопка для главных действий
```tsx
<Button variant="primary">Primary Action</Button>
```

### Success
Зелёный градиент - для положительных действий (начать, сохранить, подтвердить)
```tsx
<Button variant="success">Start Now</Button>
```

### Danger
Красный градиент - для опасных действий (удалить, сбросить)
```tsx
<Button variant="danger">Delete</Button>
```

### Purple
Фиолетовый градиент - для специальных/премиум действий
```tsx
<Button variant="purple">Premium Feature</Button>
```

### Outline
Прозрачная кнопка с синей рамкой - для второстепенных действий
```tsx
<Button variant="outline">View Details</Button>
```

### Ghost
Прозрачная кнопка с белой рамкой - для минималистичных действий
```tsx
<Button variant="ghost">Cancel</Button>
```

### Gradient
Анимированный многоцветный градиент - для особых призывов к действию
```tsx
<Button variant="gradient">Get Started</Button>
```

## Размеры (Sizes)

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>  {/* По умолчанию */}
<Button size="lg">Large</Button>
```

## Примеры

### Кнопка с загрузкой
```tsx
const [saving, setSaving] = useState(false);

<Button 
  variant="primary" 
  loading={saving}
  disabled={saving}
>
  {saving ? 'Saving...' : 'Save'}
</Button>
```

### Кнопка с иконкой
```tsx
<Button 
  variant="danger" 
  icon={<span style={{ fontSize: '1.5rem' }}>😔</span>}
>
  I Relapsed
</Button>
```

### Кнопка на всю ширину
```tsx
<Button variant="primary" fullWidth>
  Submit Form
</Button>
```

### Комбинация свойств
```tsx
<Button 
  variant="success"
  size="lg"
  fullWidth
  icon={<span>🚭</span>}
  onClick={handleStart}
>
  Start Your Journey
</Button>
```

## Особенности

- ✨ **Анимации**: Плавные переходы, эффект свечения при наведении, анимация загрузки
- 🎨 **Градиенты**: Красивые градиентные фоны для всех вариантов
- ♿ **Доступность**: Поддержка фокуса клавиатуры, уменьшение анимаций для пользователей с `prefers-reduced-motion`
- 📱 **Адаптивность**: Оптимизированные размеры для мобильных устройств
- 🔒 **Состояния**: Автоматическая обработка состояний disabled и loading

## Файлы

- **Компонент**: `/frontend/src/components/Button.tsx`
- **Стили**: `/frontend/src/components/Button.css`

## Изменённые файлы

Компонент Button был интегрирован в следующие страницы:
- ✅ LoginPage.tsx
- ✅ RegisterPage.tsx
- ✅ DashboardPage.tsx
- ✅ ProfilePage.tsx
- ✅ MarathonPage.tsx
- ✅ AdminArticlesPage.tsx
