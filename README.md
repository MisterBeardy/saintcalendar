# Saint Calendar

A comprehensive calendar application for tracking saints, milestones, and events.

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Contributing](#contributing)
- [Development](#development)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

### Calendar Views

The application offers multiple calendar views to suit different needs:

- **Month View**: A traditional monthly calendar with event highlights
- **Week View**: A weekly schedule with day-by-day event breakdowns
- **Table View**: A list view of events for detailed information

### Saint Information

- **Saint Profiles**: Detailed information about each saint
- **Event Tracking**: Track saint days and related events
- **Search Functionality**: Find saints by name or location

### Milestone Tracking

- **Achievement Badges**: Visual indicators for significant milestones
- **Milestone Charts**: Graphical representation of progress
- **Milestone Tracker**: Detailed tracking of achievements

### Admin Panel

- **User Management**: Manage user accounts and permissions
- **Sticker Management**: Approve and manage stickers
- **System Status**: Monitor system health and integration status
- **Recent Activity**: Track system and user activity

### Responsive Design

- **Dark/Light Mode**: Automatic and manual theme switching
- **Responsive Layouts**: Adapts to different screen sizes
- **Accessible Components**: Follows accessibility best practices

### Sample Data

- **Pre-loaded Events**: Sample data for immediate use
- **Mock Data Mode**: Toggle between mock and database data sources
- **Easy Customization**: Simple to replace with real data

## Screenshots

![Month View](public/placeholder.jpg)
*Monthly calendar view with event highlights*

![Week View](public/placeholder.jpg)
*Weekly schedule with day-by-day events*

![Admin Dashboard](public/placeholder.jpg)
*System status and user management*

![Saint Profile](public/placeholder.jpg)
*Detailed saint information and achievements*

![Dark Mode](public/placeholder.jpg)
*Dark theme with responsive design*

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/saintcalendar.git
   cd saintcalendar
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

The project follows a modular component-based structure with clear separation of concerns:

### Core Directories

- **`app/`**: Contains the main Next.js application structure
  - `layout.tsx`: Main application layout
  - `page.tsx`: Home page component
  - `globals.css`: Global CSS styles

- **`components/`**: Organized by feature area
  - **`calendar/`**: Calendar-related components
    - `month-view.tsx`: Monthly calendar view
    - `week-view.tsx`: Weekly calendar view
    - `table-view.tsx`: Table/list view of events
  - **`admin/`**: Admin dashboard components
    - `admin-status.tsx`: System status monitoring
    - `user-management.tsx`: User account management
  - **`sections/`**: Main application sections
    - `home/`: Home section components
    - `saints/`: Saint information components
    - `stats/`: Statistics and charts
  - **`ui/`**: Common UI components
    - `button.tsx`: Reusable button component
    - `card.tsx`: Card component with variants

- **`data/`**: Sample data files
  - `sample-events.ts`: Sample event data
  - `sample-saints.ts`: Sample saint data

- **`lib/`**: Utility functions
  - `utils.ts`: Common utility functions

- **`public/`**: Static assets
  - Images, logos, and other static files

- **`styles/`**: Global CSS and styling
  - `globals.css`: Global styles
  - Tailwind CSS configuration

- **`types/`**: TypeScript type definitions
  - `saint-events.ts`: Types for saint events
  - `location-data.ts`: Location data types

### Key Files

- **`tsconfig.json`**: TypeScript configuration
- **`next.config.mjs`**: Next.js configuration
- **`tailwind.config.mjs`**: Tailwind CSS configuration
- **`postcss.config.mjs`**: PostCSS configuration

## Technologies

- **Framework**: Next.js 14.2.16
- **Language**: TypeScript 5
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS
- **State Management**: React Hook Form
- **Charts**: Recharts
- **Date Handling**: date-fns, react-day-picker
- **Build Tools**: pnpm, PostCSS

## Contributing

We welcome contributions from the community! Here's how you can help:

### Code Contributions

1. **Fork the repository** and create a new branch
2. **Install dependencies** with `pnpm install`
3. **Make your changes** and ensure they follow our coding standards
4. **Run tests** to make sure everything works
5. **Create a pull request** with a clear description

### Coding Standards

- Follow **TypeScript** best practices
- Use **Tailwind CSS** for styling
- Keep components **small and focused**
- Write **clear, descriptive** code
- Include **JSDoc comments** for complex functions

### Commit Messages

- Use **present tense** ("Add feature" not "Added feature")
- Limit the **first line to 50 characters**
- Include a **detailed description** if needed

### Pull Requests

- **Describe what your PR does** and why
- **Reference any related issues**
- **Include screenshots** if your changes affect the UI
- **Be patient** - we'll review your PR as soon as possible

### Issues

- **Search for existing issues** before creating a new one
- **Be specific** about the problem or feature request
- **Include steps to reproduce** if reporting a bug
- **Label your issue** appropriately

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/saintcalendar.git
   cd saintcalendar
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Run the development server**:
   ```bash
   pnpm dev
   ```

4. **Open your browser** to [http://localhost:3000](http://localhost:3000)

### Testing

- **Run linting** to check for code quality:
  ```bash
  pnpm lint
  ```

- **Test different views** (month, week, table)
- **Check admin features** with mock data
- **Verify responsive design** on different devices

### Documentation

- **Update the README** if your changes affect usage
- **Add comments** to complex code
- **Keep the documentation up-to-date**

### License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Development

### Running the Project

1. **Development Mode**:
   ```bash
   pnpm dev
   ```
   - Starts the development server with hot-reloading
   - Available at [http://localhost:3000](http://localhost:3000)

2. **Build for Production**:
   ```bash
   pnpm build
   ```
   - Creates an optimized production build

3. **Start Production Server**:
   ```bash
   pnpm start
   ```
   - Starts the production server

4. **Linting**:
   ```bash
   pnpm lint
   ```
   - Runs ESLint to check for code quality issues

### Working with Data

The project includes sample data for immediate use. To switch between mock data and database data:

1. Open `components/sections/home/home-section.tsx`
2. Change the `dataSource` prop from `"mock"` to `"database"`
3. Implement the API endpoints as needed

### Adding New Components

1. Create a new file in the appropriate `components/` subdirectory
2. Follow the existing component structure and naming conventions
3. Import and use the component in the relevant section

### Styling

The project uses Tailwind CSS with custom configuration:

- **Global styles**: `styles/globals.css`
- **Component-specific styles**: Inline Tailwind classes
- **Configuration**: `tailwind.config.mjs`

To add custom styles:
1. Add your CSS to `styles/globals.css`
2. Or create a new CSS/SCSS file in the `styles/` directory
3. Import it in your component or in `app/layout.tsx`

### TypeScript

The project uses TypeScript with strict type checking:

- **Configuration**: `tsconfig.json`
- **Global types**: `types/`
- **Component types**: Inline or in separate `.d.ts` files

### Environment Variables

Create a `.env.local` file for local development:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DATABASE_URL=your-database-url
```

### Testing

To test the application:

1. Run the development server
2. Use the sample data to verify functionality
3. Check different views (month, week, table)
4. Test admin features with mock data

## License

This project is licensed under the MIT License.

## Roadmap

### Planned Features

- **Database Integration**: Replace mock data with real database
- **User Authentication**: Implement secure user login
- **API Endpoints**: Create RESTful API for data operations
- **Advanced Search**: Enhanced search functionality
- **Notifications**: Event reminders and notifications
- **Mobile App**: Native mobile application
- **Internationalization**: Multi-language support
- **Advanced Analytics**: Detailed usage statistics

### Future Improvements

- **Performance Optimization**: Improve loading times
- **Accessibility Enhancements**: Better accessibility support
- **Dark Mode Improvements**: Enhanced dark theme
- **Customization Options**: User customizable themes
- **Offline Mode**: Basic functionality without internet
- **Third-party Integrations**: Calendar sync with external services
- **Monetization**: Premium features and subscriptions

## FAQ

### General Questions

**Q: What is Saint Calendar?**
A: Saint Calendar is a comprehensive calendar application for tracking saints, milestones, and events.

**Q: Is this project open source?**
A: Yes, this project is open source and licensed under the MIT License.

**Q: Can I use this for commercial projects?**
A: Yes, you can use this project for commercial purposes under the MIT License.

### Technical Questions

**Q: What technologies are used?**
A: The project uses Next.js, TypeScript, React, Tailwind CSS, and other modern web technologies.

**Q: How do I switch to database mode?**
A: Change the `dataSource` prop in `components/sections/home/home-section.tsx` from `"mock"` to `"database"`.

**Q: How can I add custom events?**
A: Modify the `sampleEvents` array in `data/sample-events.ts` or implement API endpoints for dynamic data.

### Development Questions

**Q: How do I run the project locally?**
A: Install dependencies with `pnpm install` and start the development server with `pnpm dev`.

**Q: How can I contribute?**
A: Fork the repository, create a new branch, make your changes, and submit a pull request.

**Q: What coding standards should I follow?**
A: Follow TypeScript best practices, use Tailwind CSS for styling, and keep components small and focused.

### Usage Questions

**Q: How do I switch between views?**
A: Use the view toggles in the calendar header to switch between month, week, and table views.

**Q: How can I search for saints?**
A: Use the search functionality in the saints section to find saints by name or location.

**Q: How do I access admin features?**
A: Navigate to the admin section in the sidebar to access user and sticker management.

## Acknowledgments

### Contributors

- **Project Founder**: [Your Name]
- **Initial Developers**: [List of initial contributors]
- **Active Maintainers**: [List of active maintainers]

### Resources

- **Next.js**: The React framework for production
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible, low-level UI components
- **date-fns**: Modern JavaScript date utility library
- **Recharts**: Redefined chart library built with React and D3

### Inspiration

- **Open Source Community**: For their continuous support and contributions
- **Religious Calendar Projects**: For inspiration on tracking religious events
- **Modern Web Development**: For pushing the boundaries of what's possible

### Special Thanks

- **Early Adopters**: For testing and providing valuable feedback
- **Design Inspiration**: From various open source projects
- **Community Support**: For helping with issues and feature requests
