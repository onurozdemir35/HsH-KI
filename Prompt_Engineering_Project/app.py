from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todos.db'
db = SQLAlchemy(app)

class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    in_progress = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50), nullable=False)  # Yeni sütun eklendi

@app.route('/')
def index():
    todos = Todo.query.all()
    return render_template('index.html', todos=todos)

@app.route('/add', methods=['POST'])
def add_todo():
    data = request.get_json()
    todo_text = data.get('todoInput')
    category = data.get('categorySelect')
    if todo_text and category:
        new_todo = Todo(text=todo_text, category=category)
        db.session.add(new_todo)
        db.session.commit()
        return jsonify({'id': new_todo.id, 'text': new_todo.text, 'completed': new_todo.completed, 'in_progress': new_todo.in_progress, 'category': new_todo.category})
    return jsonify({'error': 'Missing todo text or category'}), 400

@app.route('/delete/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    todo = Todo.query.get(todo_id)
    if todo:
        db.session.delete(todo)
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'error': 'Todo not found'}), 404

@app.route('/edit/<int:todo_id>', methods=['PUT'])
def edit_todo(todo_id):
    data = request.get_json()
    new_text = data.get('text')
    new_category = data.get('category')
    todo = Todo.query.get(todo_id)
    if todo and new_text:
        todo.text = new_text
        todo.category = new_category
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'error': 'Todo not found or missing text'}), 400

@app.route('/complete/<int:todo_id>', methods=['PUT'])
def complete_todo(todo_id):
    todo = Todo.query.get(todo_id)
    if todo:
        todo.completed = not todo.completed
        if todo.completed:
            todo.in_progress = False
        db.session.commit()
        return jsonify({'success': True, 'completed': todo.completed})
    return jsonify({'error': 'Todo not found'}), 404

@app.route('/inprogress/<int:todo_id>', methods=['PUT'])
def inprogress_todo(todo_id):
    todo = Todo.query.get(todo_id)
    if todo:
        todo.in_progress = not todo.in_progress
        if todo.in_progress:
            todo.completed = False
        db.session.commit()
        return jsonify({'success': True, 'in_progress': todo.in_progress})
    return jsonify({'error': 'Todo not found'}), 404

@app.route('/todos', methods=['GET'])
def get_todos():
    todos = Todo.query.all()
    return jsonify({'todos': [{'id': todo.id, 'text': todo.text, 'completed': todo.completed, 'in_progress': todo.in_progress, 'category': todo.category} for todo in todos]})

@app.route('/edit/<int:todo_id>', methods=['GET'])
def edit_page(todo_id):
    return render_template('edit.html')

@app.route('/todo/<int:todo_id>', methods=['GET'])
def get_todo(todo_id):
    todo = Todo.query.get(todo_id)
    if todo:
        return jsonify({'id': todo.id, 'text': todo.text, 'category': todo.category})
    return jsonify({'error': 'Todo not found'}), 404

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)