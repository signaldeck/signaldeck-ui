from flask import Blueprint

bp = Blueprint(
    "signaldeck_ui",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/signaldeck_ui/static",
)
