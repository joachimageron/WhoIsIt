# Next.js & HeroUI Template

This is a template for creating applications using Next.js 14 (app directory) and HeroUI (v2).

[Try it on CodeSandbox](https://githubbox.com/heroui-inc/heroui/next-app-template)

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [HeroUI v2](https://heroui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)

## How to Use

### Use the template with create-next-app

To create a new project based on this template using `create-next-app`, run the following command:

```bash
npx create-next-app -e https://github.com/heroui-inc/next-app-template
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## Theme Customization

The application uses custom semantic colors configured in `tailwind.config.js`. The color palette is consistent across both light and dark themes:

### Semantic Colors

- **Primary (Brand)**: Orange (#F07507) - Used for primary actions and branding
- **Success**: Green (#08D877) - Used for success states and positive feedback
- **Warning**: Yellow (#FFE207) - Used for warnings and cautionary messages
- **Danger**: Red (#FF5959) - Used for errors and destructive actions
- **Secondary (Info)**: Cyan (#06BBE8) - Used for informational elements

Each color includes shades from 100 (lightest) to 900 (darkest) for flexible usage throughout the application. These colors are applied to Hero UI components automatically when using color props like `color="primary"`, `color="success"`, etc.

## License

Licensed under the [MIT license](https://github.com/heroui-inc/next-app-template/blob/main/LICENSE).
