from modules import utils

class SubjectsManager:
    def __init__(self):
        self.subjects_file = "data/subjects.json"

    def get_all_subjects(self):
        subjects = utils.load_json(self.subjects_file) or {}
        return subjects.get("subjects", [])

    def get_subject(self, subject_name):
        subjects = self.get_all_subjects()
        return subject_name if subject_name in subjects else None

    def add_subject(self, subject_data):
        name = subject_data.get("name")
        if not name:
            return None
            
        subjects = self.get_all_subjects()
        if name in subjects:
            return None
            
        subjects.append(name)
        utils.save_json(self.subjects_file, {"subjects": subjects})
        return {"name": name}

    def update_subject(self, old_name, subject_data):
        new_name = subject_data.get("name")
        if not new_name:
            return None
            
        subjects = self.get_all_subjects()
        if old_name not in subjects:
            return None
            
        if new_name != old_name and new_name in subjects:
            return None
            
        subjects[subjects.index(old_name)] = new_name
        utils.save_json(self.subjects_file, {"subjects": subjects})
        return {"name": new_name}

    def delete_subject(self, subject_name):
        subjects = self.get_all_subjects()
        if subject_name not in subjects:
            return False
            
        subjects.remove(subject_name)
        utils.save_json(self.subjects_file, {"subjects": subjects})
        return True