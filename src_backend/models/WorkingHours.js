import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const WorkingHours = sequelize.define(
  "WorkingHours",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    open_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    close_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  },
  {
    tableName: "WorkingHours",
    timestamps: false,
  }
)

export default WorkingHours 