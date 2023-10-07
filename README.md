# Jewellery Store Management System Client

**Note**: This repository exclusively contains the frontend codebase for Angular and cannot be used as a standalone project.

## Overview

This application is designed to manage jewelry stores and store their day-to-day data. It operates offline and does not require an active internet connection. The primary goal of this repository is to be adaptable to various backends, such as [Tauri](https://tauri.app/), [Electron](https://www.electronjs.org/), etc. You can use this repository as a submodule in your main backend repository.

## Integration Steps

To integrate this codebase with your backend, follow these steps:

1. Initialize your backend repository as an Angular project.
2. Add this repository as a submodule to your backend repository.
3. Implement Angular Services on your backend while maintaining the same folder structure as provided inside the **interfaces** folder of this repository.

## Tech Stack

- **Client**: Angular v14, Bootstrap v5
- **Database**: MySQL v8

## Future Features

This project has several exciting features planned for the future, including:

- [ ] **Different Reports Download (Excel/PDF) for tax filing**
- [ ] **Backup/Import Database**
- [ ] **UI/UX enhancements**
- [ ] **In-app updater**
- [ ] **License/Activation Key Support**
- [ ] **Performance improvements**

## Contributing

We welcome contributions from the community. Please create pull requests for any issues or feature requests. This project is a continuous work-in-progress, and your input is valuable.

## References

For additional resources and inspiration, you can refer to the [Lightning Admin Angular repository](https://github.com/azouaoui-med/lightning-admin-angular).

Feel free to enhance this README.md to provide more context and details about your project.
