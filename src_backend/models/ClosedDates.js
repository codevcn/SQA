import { DataTypes } from "sequelize"
import sequelize from "../config/db.js"

const ClosedDates = sequelize.define(
  "ClosedDates",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    closed_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      unique: true,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "ClosedDates",
    timestamps: false,
  }
)

export default ClosedDates 