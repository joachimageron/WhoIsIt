# UI Components with HeroUI

## Overview

WhoIsIt uses **HeroUI** (formerly NextUI) as its primary component library. HeroUI is a modern React UI library built on top of Tailwind CSS, providing beautiful, accessible, and customizable components out of the box.

## Why HeroUI?

### Advantages

- ✅ **Built for Next.js** - Native support for App Router and Server Components
- ✅ **Tailwind CSS Integration** - Seamless styling with Tailwind
- ✅ **Accessible** - WAI-ARIA compliant components
- ✅ **Customizable** - Theme system with variants
- ✅ **TypeScript** - Full TypeScript support
- ✅ **Dark Mode** - Built-in dark mode support
- ✅ **Performance** - Tree-shakable, optimized bundle size

## Installation

HeroUI is installed as multiple packages in the monorepo:

```bash
pnpm add @heroui/react @heroui/theme
```

**Installed Packages**:
- `@heroui/react` - Main React components
- `@heroui/theme` - Theme configuration
- `@heroui/system` - Core system
- Individual component packages (Button, Card, Input, etc.)

## Configuration

### Tailwind Configuration

```javascript
// tailwind.config.js
import { heroui } from '@heroui/theme';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          primary: {
            DEFAULT: '#0070F3',
            foreground: '#FFFFFF',
          },
          focus: '#0070F3',
        },
      },
      dark: {
        colors: {
          primary: {
            DEFAULT: '#0070F3',
            foreground: '#FFFFFF',
          },
          focus: '#0070F3',
        },
      },
    },
  })],
};
```

### Provider Setup

```tsx
// app/[lang]/layout.tsx
import { HeroUIProvider } from '@heroui/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HeroUIProvider>
          {children}
        </HeroUIProvider>
      </body>
    </html>
  );
}
```

## Core Components

### Button

**Purpose**: Interactive buttons with various styles and states

```tsx
import { Button } from '@heroui/react';

// Basic
<Button>Click Me</Button>

// Colors
<Button color="primary">Primary</Button>
<Button color="secondary">Secondary</Button>
<Button color="success">Success</Button>
<Button color="warning">Warning</Button>
<Button color="danger">Danger</Button>

// Variants
<Button variant="solid">Solid</Button>
<Button variant="bordered">Bordered</Button>
<Button variant="light">Light</Button>
<Button variant="flat">Flat</Button>
<Button variant="faded">Faded</Button>
<Button variant="shadow">Shadow</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button isLoading>Loading...</Button>
<Button isDisabled>Disabled</Button>

// Icons
<Button 
  startContent={<PlusIcon />}
  endContent={<ArrowIcon />}
>
  With Icons
</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### Card

**Purpose**: Container for content with various styles

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/react';

<Card>
  <CardHeader>
    <h4>Card Title</h4>
  </CardHeader>
  <CardBody>
    <p>Card content goes here...</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Hoverable
<Card isHoverable>
  <CardBody>Hover over me!</CardBody>
</Card>

// Pressable
<Card isPressable onPress={() => console.log('pressed')}>
  <CardBody>Click me!</CardBody>
</Card>

// Blurred
<Card isBlurred className="bg-background/60">
  <CardBody>Blurred background</CardBody>
</Card>
```

### Input

**Purpose**: Text input fields with validation

```tsx
import { Input } from '@heroui/react';

// Basic
<Input label="Email" placeholder="Enter your email" />

// Types
<Input type="text" label="Text" />
<Input type="email" label="Email" />
<Input type="password" label="Password" />
<Input type="number" label="Number" />

// Variants
<Input variant="flat" label="Flat" />
<Input variant="bordered" label="Bordered" />
<Input variant="faded" label="Faded" />
<Input variant="underlined" label="Underlined" />

// With icons
<Input
  label="Search"
  placeholder="Type to search..."
  startContent={<SearchIcon />}
  endContent={<ClearIcon />}
/>

// Validation
<Input
  label="Email"
  isInvalid={!isValid}
  errorMessage="Please enter a valid email"
/>

// Disabled/Required
<Input label="Name" isDisabled />
<Input label="Name" isRequired />

// Description
<Input
  label="Username"
  description="Username must be unique"
/>
```

### Modal

**Purpose**: Dialog overlay for focused interactions

```tsx
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure 
} from '@heroui/react';

export function MyComponent() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button onPress={onOpen}>Open Modal</Button>
      
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            <h3>Modal Title</h3>
          </ModalHeader>
          <ModalBody>
            <p>Modal content goes here...</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Close
            </Button>
            <Button color="primary" onPress={onClose}>
              Action
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// Sizes
<Modal size="xs">...</Modal>
<Modal size="sm">...</Modal>
<Modal size="md">...</Modal>
<Modal size="lg">...</Modal>
<Modal size="xl">...</Modal>
<Modal size="2xl">...</Modal>
<Modal size="full">...</Modal>

// Scrollable
<Modal scrollBehavior="inside">...</Modal>
<Modal scrollBehavior="outside">...</Modal>
```

### Avatar

**Purpose**: User profile images

```tsx
import { Avatar, AvatarGroup } from '@heroui/react';

// Basic
<Avatar src="/avatar.jpg" />

// Sizes
<Avatar size="sm" src="/avatar.jpg" />
<Avatar size="md" src="/avatar.jpg" />
<Avatar size="lg" src="/avatar.jpg" />

// With name fallback
<Avatar name="John Doe" />

// With badge
<Avatar 
  src="/avatar.jpg"
  isBordered
  color="success"
/>

// Group
<AvatarGroup max={3}>
  <Avatar src="/avatar1.jpg" />
  <Avatar src="/avatar2.jpg" />
  <Avatar src="/avatar3.jpg" />
  <Avatar src="/avatar4.jpg" />
</AvatarGroup>
```

### Dropdown

**Purpose**: Context menus and select dropdowns

```tsx
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';

<Dropdown>
  <DropdownTrigger>
    <Button>Open Menu</Button>
  </DropdownTrigger>
  <DropdownMenu aria-label="Actions">
    <DropdownItem key="new">New file</DropdownItem>
    <DropdownItem key="copy">Copy link</DropdownItem>
    <DropdownItem key="edit">Edit file</DropdownItem>
    <DropdownItem key="delete" color="danger">
      Delete file
    </DropdownItem>
  </DropdownMenu>
</Dropdown>

// With icons
<DropdownMenu>
  <DropdownItem key="new" startContent={<PlusIcon />}>
    New file
  </DropdownItem>
</DropdownMenu>

// Selection
<DropdownMenu 
  selectionMode="single"
  selectedKeys={selected}
  onSelectionChange={setSelected}
>
  <DropdownItem key="option1">Option 1</DropdownItem>
  <DropdownItem key="option2">Option 2</DropdownItem>
</DropdownMenu>
```

### Spinner

**Purpose**: Loading indicators

```tsx
import { Spinner } from '@heroui/react';

// Basic
<Spinner />

// Colors
<Spinner color="primary" />
<Spinner color="secondary" />
<Spinner color="success" />
<Spinner color="warning" />
<Spinner color="danger" />

// Sizes
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />

// With label
<Spinner label="Loading..." />
```

### Tooltip

**Purpose**: Contextual information on hover

```tsx
import { Tooltip } from '@heroui/react';

<Tooltip content="Tooltip content">
  <Button>Hover me</Button>
</Tooltip>

// Placement
<Tooltip content="Top" placement="top">
  <Button>Top</Button>
</Tooltip>
<Tooltip content="Bottom" placement="bottom">
  <Button>Bottom</Button>
</Tooltip>
<Tooltip content="Left" placement="left">
  <Button>Left</Button>
</Tooltip>
<Tooltip content="Right" placement="right">
  <Button>Right</Button>
</Tooltip>

// Colors
<Tooltip content="Primary" color="primary">
  <Button>Primary</Button>
</Tooltip>
```

### Chip

**Purpose**: Tags, badges, and labels

```tsx
import { Chip } from '@heroui/react';

// Basic
<Chip>Default</Chip>

// Colors
<Chip color="primary">Primary</Chip>
<Chip color="success">Success</Chip>
<Chip color="warning">Warning</Chip>
<Chip color="danger">Danger</Chip>

// Variants
<Chip variant="solid">Solid</Chip>
<Chip variant="bordered">Bordered</Chip>
<Chip variant="light">Light</Chip>
<Chip variant="flat">Flat</Chip>
<Chip variant="faded">Faded</Chip>
<Chip variant="shadow">Shadow</Chip>
<Chip variant="dot">Dot</Chip>

// Closeable
<Chip onClose={() => console.log('close')}>
  Closeable
</Chip>

// With avatar
<Chip avatar={<Avatar src="/avatar.jpg" />}>
  User Name
</Chip>
```

### Progress

**Purpose**: Progress indicators

```tsx
import { Progress } from '@heroui/react';

// Basic
<Progress value={50} />

// Colors
<Progress value={50} color="primary" />
<Progress value={50} color="success" />
<Progress value={50} color="warning" />
<Progress value={50} color="danger" />

// Sizes
<Progress value={50} size="sm" />
<Progress value={50} size="md" />
<Progress value={50} size="lg" />

// With label
<Progress
  value={50}
  label="Loading..."
  showValueLabel={true}
/>

// Indeterminate
<Progress isIndeterminate />
```

## Theme Customization

### Custom Colors

```javascript
// tailwind.config.js
import { heroui } from '@heroui/theme';

export default {
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              50: '#e6f1fe',
              100: '#cce3fd',
              200: '#99c7fb',
              300: '#66aaf9',
              400: '#338ef7',
              500: '#0072f5',
              600: '#005bc4',
              700: '#004493',
              800: '#002e62',
              900: '#001731',
              DEFAULT: '#0072f5',
              foreground: '#ffffff',
            },
            success: {
              DEFAULT: '#17c964',
              foreground: '#000000',
            },
            warning: {
              DEFAULT: '#f5a524',
              foreground: '#000000',
            },
            danger: {
              DEFAULT: '#f31260',
              foreground: '#ffffff',
            },
          },
        },
      },
    }),
  ],
};
```

### Custom Variants

```typescript
// components/custom-button.tsx
import { extendVariants, Button } from '@heroui/react';

export const MyButton = extendVariants(Button, {
  variants: {
    color: {
      olive: 'text-[#000] bg-[#84cc16]',
      orange: 'bg-[#ff8c00] text-[#fff]',
      violet: 'bg-[#8b5cf6] text-[#fff]',
    },
    isDisabled: {
      true: 'bg-[#eaeaea] text-[#000] opacity-50 cursor-not-allowed',
    },
    size: {
      xs: 'px-2 min-w-12 h-6 text-tiny gap-1 rounded-small',
      md: 'px-4 min-w-20 h-10 text-small gap-2 rounded-small',
      xl: 'px-8 min-w-28 h-14 text-large gap-4 rounded-medium',
    },
  },
  defaultVariants: {
    color: 'olive',
    size: 'xl',
  },
});

// Usage
<MyButton color="orange" size="md">Custom Button</MyButton>
```

## Layout Components

### Navbar

```tsx
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from '@heroui/react';

<Navbar>
  <NavbarBrand>
    <Logo />
  </NavbarBrand>
  
  <NavbarContent className="hidden sm:flex gap-4" justify="center">
    <NavbarItem>
      <Link href="/game/create">Create Game</Link>
    </NavbarItem>
    <NavbarItem>
      <Link href="/game/join">Join Game</Link>
    </NavbarItem>
  </NavbarContent>
  
  <NavbarContent justify="end">
    <NavbarItem>
      <Button color="primary">Login</Button>
    </NavbarItem>
  </NavbarContent>
  
  <NavbarMenuToggle className="sm:hidden" />
  
  <NavbarMenu>
    <NavbarMenuItem>
      <Link href="/game/create">Create Game</Link>
    </NavbarMenuItem>
    <NavbarMenuItem>
      <Link href="/game/join">Join Game</Link>
    </NavbarMenuItem>
  </NavbarMenu>
</Navbar>
```

### Divider

```tsx
import { Divider } from '@heroui/react';

<div>
  <p>Content above</p>
  <Divider className="my-4" />
  <p>Content below</p>
</div>
```

### Spacer

```tsx
import { Spacer } from '@heroui/react';

<div>
  <Button>Button 1</Button>
  <Spacer x={2} />
  <Button>Button 2</Button>
</div>
```

## Form Components

### Checkbox

```tsx
import { Checkbox, CheckboxGroup } from '@heroui/react';

// Single
<Checkbox defaultSelected>Accept terms</Checkbox>

// Group
<CheckboxGroup
  label="Select features"
  value={selected}
  onValueChange={setSelected}
>
  <Checkbox value="feature1">Feature 1</Checkbox>
  <Checkbox value="feature2">Feature 2</Checkbox>
  <Checkbox value="feature3">Feature 3</Checkbox>
</CheckboxGroup>
```

### Radio

```tsx
import { Radio, RadioGroup } from '@heroui/react';

<RadioGroup
  label="Select option"
  value={selected}
  onValueChange={setSelected}
>
  <Radio value="option1">Option 1</Radio>
  <Radio value="option2">Option 2</Radio>
  <Radio value="option3">Option 3</Radio>
</RadioGroup>
```

### Select

```tsx
import { Select, SelectItem } from '@heroui/react';

<Select
  label="Favorite Animal"
  placeholder="Select an animal"
  selectedKeys={[selected]}
  onSelectionChange={(keys) => setSelected(Array.from(keys)[0])}
>
  <SelectItem key="cat">Cat</SelectItem>
  <SelectItem key="dog">Dog</SelectItem>
  <SelectItem key="elephant">Elephant</SelectItem>
</Select>
```

### Switch

```tsx
import { Switch } from '@heroui/react';

<Switch defaultSelected>Enable notifications</Switch>

// Colors
<Switch color="success">Success</Switch>
<Switch color="warning">Warning</Switch>
<Switch color="danger">Danger</Switch>

// With thumbs icon
<Switch
  thumbIcon={({ isSelected }) =>
    isSelected ? <CheckIcon /> : <CrossIcon />
  }
>
  Dark Mode
</Switch>
```

### Textarea

```tsx
import { Textarea } from '@heroui/react';

<Textarea
  label="Description"
  placeholder="Enter your description"
  minRows={3}
  maxRows={8}
/>

// With validation
<Textarea
  label="Message"
  isInvalid={!isValid}
  errorMessage="Message is required"
/>
```

## Best Practices

### 1. Use Semantic Colors

```tsx
// ✅ Good - Semantic meaning
<Button color="primary">Main Action</Button>
<Button color="danger">Delete</Button>
<Button color="success">Confirm</Button>

// ❌ Bad - No semantic meaning
<Button className="bg-blue-500">Main Action</Button>
```

### 2. Consistent Spacing

```tsx
// ✅ Good - Consistent spacing
<div className="flex flex-col gap-4">
  <Input label="Name" />
  <Input label="Email" />
  <Button>Submit</Button>
</div>
```

### 3. Accessible Components

```tsx
// ✅ Good - Accessible
<Button aria-label="Close modal" onPress={onClose}>
  <CloseIcon />
</Button>

<Input
  label="Email"
  type="email"
  isRequired
  aria-required="true"
/>
```

### 4. Responsive Design

```tsx
// ✅ Good - Responsive
<Card className="w-full sm:w-1/2 lg:w-1/3">
  <CardBody>Responsive card</CardBody>
</Card>

<Button
  className="w-full sm:w-auto"
  size={{ base: 'md', sm: 'lg' }}
>
  Responsive Button
</Button>
```

### 5. Loading States

```tsx
// ✅ Good - Show loading state
<Button isLoading={isLoading} onPress={handleSubmit}>
  {isLoading ? 'Submitting...' : 'Submit'}
</Button>
```

## Related Documentation

- [Application Structure](./application-structure.md)
- [State Management](./state-management.md)
- [Internationalization](./internationalization.md)

---

**Last Updated**: November 2024
