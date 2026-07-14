from flask import jsonify


def success(data=None, message: str = "Success", status: int = 200):
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def error(message: str = "An error occurred", status: int = 400, details=None):
    payload = {"success": False, "error": message}
    if details:
        payload["details"] = details
    return jsonify(payload), status


def paginated(items: list, total: int, page: int, per_page: int):
    return jsonify(
        {
            "success": True,
            "data": items,
            "pagination": {
                "total": total,
                "page": page,
                "perPage": per_page,
                "totalPages": (total + per_page - 1) // per_page,
            },
        }
    ), 200
