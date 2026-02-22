# SignalDeck UI

**SignalDeck UI** is the shared UI kit for the SignalDeck framework.

It provides:

-   The base page layout (`ui/layout.html`)
-   Shared Jinja macros (`ui/_utils.html`)
-   Common components (e.g. `core/components/*`)
-   Static assets (CSS/JS)
-   Optional vendored libraries (jQuery, Chart.js, Font Awesome)

SignalDeck UI is shipped as a Python package and exposed to Flask via a
blueprint.\
It is designed to be **generic**, while **instance projects** can
override styling and templates.

------------------------------------------------------------------------

## Installation

``` bash
pip install signaldeck-ui
```

For local development:

``` bash
pip install -e .
```

------------------------------------------------------------------------

## Usage (Core Runtime)

Register the UI blueprint in the SignalDeck core app:

``` python
from signaldeck_ui import bp as ui_bp

app.register_blueprint(ui_bp)
```

UI assets are then available via:

``` jinja2
{{ url_for('signaldeck_ui.static', filename='core/base.css') }}
{{ url_for('signaldeck_ui.static', filename='core/app.js') }}
```

------------------------------------------------------------------------

## Template Conventions

### Layout

Plugins and core pages should use the shared layout:

``` jinja2
{% extends "ui/layout.html" %}
```

### Macros / Utilities

Import shared macros from `_utils.html`:

``` jinja2
{% import "ui/_utils.html" as ui %}
```

### Components (Fragments)

Processor templates are **components**, not full pages.\
They should render only a fragment (e.g. a card section), and should
**not** extend the base layout.

Example:

``` jinja2
<div class="sd-card">
  <h3>{{ title }}</h3>
  <p>{{ text }}</p>
</div>
```

Pages are composed by the core runtime (e.g. `ui/index.html`).

------------------------------------------------------------------------

## Static Assets

Recommended structure:

-   `static/core/base.css` → Base styling for cards, buttons,
    typography\
-   `static/core/app.js` → Common JS helpers (optional)\
-   `static/vendor/*` → Optional vendored libraries

------------------------------------------------------------------------

## Instance Overrides (Theming)

SignalDeck Core can prepend additional template directories at runtime:

``` bash
signaldeck run --config config/haus.json --templates ./templates
```

This enables instance projects to override UI templates, e.g.:

    ./templates/ui/layout.html

### CSS Overrides

A common pattern is to load an additional theme stylesheet from instance
config:

``` yaml
theme_css_url: "/static/theme.css"
```

The base layout can include it conditionally:

``` jinja2
<link rel="stylesheet" href="{{ url_for('signaldeck_ui.static', filename='core/base.css') }}">
{% if config.get('theme_css_url') %}
<link rel="stylesheet" href="{{ config.get('theme_css_url') }}">
{% endif %}
```

------------------------------------------------------------------------

## Repository Layout

    signaldeck-ui/
      pyproject.toml
      signaldeck_ui/
        blueprint.py
        templates/
          core/
            layout.html
            _utils.html
            index.html
            components/
              group.html
        static/
          core/
            base.css
            app.js
          vendor/
            jquery/
            chartjs/
            fontawesome/

------------------------------------------------------------------------

## Design Goals

-   Clean separation between runtime and presentation\
-   Reusable base layout for all plugins\
-   Simple component-based rendering\
-   Easy theming without forking\
-   Minimal external dependencies

------------------------------------------------------------------------

## License

MIT (or your chosen license)
