from modules import utils

class TaskManager:
    def __init__(self):
        self.tasks_file = "data/tasks.json"

    def get_all_tasks(self):
        tasks = utils.load_json(self.tasks_file) or {}
        return tasks.get("tasks", [])

    def get_task(self, task_id):
        tasks = self.get_all_tasks()
        return next((t for t in tasks if t.get("id") == task_id), None)

    def add_task(self, task_data):
        tasks = self.get_all_tasks()
        new_id = utils.next_id(tasks)
        task = {
            "id": new_id,
            "title": task_data.get("title"),
            "priority": task_data.get("priority", "normal"),
            "due": task_data.get("due"),
            "status": "pending",
            "created": utils.timestamp()
        }
        tasks.append(task)
        utils.save_json(self.tasks_file, {"tasks": tasks})
        return task

    def update_task(self, task_id, task_data):
        tasks = self.get_all_tasks()
        for i, task in enumerate(tasks):
            if task.get("id") == task_id:
                task.update({
                    "title": task_data.get("title", task["title"]),
                    "priority": task_data.get("priority", task["priority"]),
                    "due": task_data.get("due", task["due"]),
                    "status": task_data.get("status", task["status"])
                })
                if task_data.get("status") == "completed":
                    task["completed_at"] = utils.timestamp()
                utils.save_json(self.tasks_file, {"tasks": tasks})
                return task
        return None

    def delete_task(self, task_id):
        tasks = self.get_all_tasks()
        new_tasks = [t for t in tasks if t.get("id") != task_id]
        if len(new_tasks) < len(tasks):
            utils.save_json(self.tasks_file, {"tasks": new_tasks})
            return True
        return False