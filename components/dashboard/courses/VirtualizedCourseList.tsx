import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader } from "@/components/dashboard/ui/card";
import { Badge } from "@/components/dashboard/ui/badge";
import { Button } from "@/components/dashboard/ui/button";
import { Star, Users, Clock, Edit, Trash2 } from "lucide-react";
import type { Course } from '@/store/dashboard/courseStore';

interface VirtualizedCourseListProps {
  courses: Course[];
  viewMode: 'grid' | 'list';
  currency: 'USD' | 'INR';
  onCourseClick: (course: Course) => void;
  onEditCourse?: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  selectedCourseIds?: string[];
  onToggleSelection?: (courseId: string) => void;
  height?: number;
}

// Memoized course item component for performance
const CourseItem = React.memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    courses: Course[];
    viewMode: 'grid' | 'list';
    currency: 'USD' | 'INR';
    onCourseClick: (course: Course) => void;
    onEditCourse?: (course: Course) => void;
    onDeleteCourse?: (courseId: string) => void;
    selectedCourseIds?: string[];
    onToggleSelection?: (courseId: string) => void;
    itemsPerRow: number;
  };
}>(({ index, style, data }) => {
  const {
    courses,
    viewMode,
    currency,
    onCourseClick,
    onEditCourse,
    onDeleteCourse,
    selectedCourseIds = [],
    onToggleSelection,
    itemsPerRow
  } = data;

  if (viewMode === 'grid') {
    // Grid mode: render multiple items per row
    const startIndex = index * itemsPerRow;
    const endIndex = Math.min(startIndex + itemsPerRow, courses.length);
    const rowCourses = courses.slice(startIndex, endIndex);

    return (
      <div style={style} className="flex gap-4 px-4">
        {rowCourses.map((course) => (
          <GridCourseCard
            key={course.id}
            course={course}
            currency={currency}
            onCourseClick={onCourseClick}
            onEditCourse={onEditCourse}
            onDeleteCourse={onDeleteCourse}
            isSelected={selectedCourseIds.includes(course.id)}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
    );
  } else {
    // List mode: one item per row
    const course = courses[index];
    if (!course) return null;

    return (
      <div style={style} className="px-4">
        <ListCourseCard
          course={course}
          currency={currency}
          onCourseClick={onCourseClick}
          onEditCourse={onEditCourse}
          onDeleteCourse={onDeleteCourse}
          isSelected={selectedCourseIds.includes(course.id)}
          onToggleSelection={onToggleSelection}
        />
      </div>
    );
  }
});

CourseItem.displayName = 'CourseItem';

// Memoized grid card component
const GridCourseCard = React.memo<{
  course: Course;
  currency: 'USD' | 'INR';
  onCourseClick: (course: Course) => void;
  onEditCourse?: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  isSelected: boolean;
  onToggleSelection?: (courseId: string) => void;
}>(({ course, currency, onCourseClick, onEditCourse, onDeleteCourse, isSelected, onToggleSelection }) => {
  const price = currency === "INR" ? course.priceINR || course.price : course.price;
  const currencySymbol = currency === "INR" ? "INR " : "$";

  const handleClick = useCallback(() => {
    onCourseClick(course);
  }, [course, onCourseClick]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEditCourse?.(course);
  }, [course, onEditCourse]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteCourse?.(course.id);
  }, [course.id, onDeleteCourse]);

  const handleToggleSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleSelection?.(course.id);
  }, [course.id, onToggleSelection]);

  return (
    <Card 
      className={`w-full max-w-sm cursor-pointer transition-all hover:shadow-lg border-2 border-orange-400 hover:border-orange-500 ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleClick}
    >
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <Badge variant={course.status === "Active" ? "default" : "secondary"}>
            {course.status}
          </Badge>
          <div className="flex gap-2">
            {onToggleSelection && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleToggleSelection}
                className="rounded"
              />
            )}
            {onEditCourse && (
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDeleteCourse && (
              <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4 text-purple-500" />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-gray-400">{course.courseId || course.id}</span>
          </div>
          <h3 className="font-semibold text-lg line-clamp-2">{course.name}</h3>
          <p className="text-sm text-muted-foreground">{course.instructor}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{course.rating?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.enrolledStudents || 0}</span>
            </div>
            {course.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{course.duration}h</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {currencySymbol}{price?.toLocaleString() || '0'}
            </p>
            <Badge variant="outline">{course.level}</Badge>
          </div>
          <Badge variant="secondary">{course.category}</Badge>
        </div>
      </CardContent>
    </Card>
  );
});

GridCourseCard.displayName = 'GridCourseCard';

// Memoized list card component
const ListCourseCard = React.memo<{
  course: Course;
  currency: 'USD' | 'INR';
  onCourseClick: (course: Course) => void;
  onEditCourse?: (course: Course) => void;
  onDeleteCourse?: (courseId: string) => void;
  isSelected: boolean;
  onToggleSelection?: (courseId: string) => void;
}>(({ course, currency, onCourseClick, onEditCourse, onDeleteCourse, isSelected, onToggleSelection }) => {
  const price = currency === "INR" ? course.priceINR || course.price : course.price;
  const currencySymbol = currency === "INR" ? "INR " : "$";

  const handleClick = useCallback(() => {
    onCourseClick(course);
  }, [course, onCourseClick]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEditCourse?.(course);
  }, [course, onEditCourse]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteCourse?.(course.id);
  }, [course.id, onDeleteCourse]);

  const handleToggleSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleSelection?.(course.id);
  }, [course.id, onToggleSelection]);

  return (
    <Card 
      className={`w-full cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {onToggleSelection && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleToggleSelection}
                className="rounded"
              />
            )}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-gray-500">{course.courseId || course.id}</span>
                <h3 className="font-semibold text-lg">{course.name}</h3>
                <Badge variant={course.status === "Active" ? "default" : "secondary"}>
                  {course.status}
                </Badge>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>Instructor: {course.instructor}</span>
                <Badge variant="outline">{course.level}</Badge>
                <Badge variant="secondary">{course.category}</Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{course.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.enrolledStudents || 0} students</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold">
                {currencySymbol}{price?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-muted-foreground">
                {course.completionRate?.toFixed(1) || '0'}% completion
              </p>
            </div>
            <div className="flex gap-2">
              {onEditCourse && (
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDeleteCourse && (
                <Button variant="ghost" size="sm" onClick={handleDelete}>
                 <Trash2 className="mr-2 h-4 w-4 text-purple-500" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ListCourseCard.displayName = 'ListCourseCard';

// Main virtualized course list component
export const VirtualizedCourseList: React.FC<VirtualizedCourseListProps> = ({
  courses,
  viewMode,
  currency,
  onCourseClick,
  onEditCourse,
  onDeleteCourse,
  selectedCourseIds = [],
  onToggleSelection,
  height = 600
}) => {
  const { itemCount, itemSize, itemsPerRow } = useMemo(() => {
    if (viewMode === 'grid') {
      const itemsPerRow = 3; // 3 cards per row in grid mode
      const itemCount = Math.ceil(courses.length / itemsPerRow);
      const itemSize = 320; // Height of each row in grid mode
      return { itemCount, itemSize, itemsPerRow };
    } else {
      const itemCount = courses.length;
      const itemSize = 120; // Height of each row in list mode
      const itemsPerRow = 1;
      return { itemCount, itemSize, itemsPerRow };
    }
  }, [courses.length, viewMode]);

  const itemData = useMemo(() => ({
    courses,
    viewMode,
    currency,
    onCourseClick,
    onEditCourse,
    onDeleteCourse,
    selectedCourseIds,
    onToggleSelection,
    itemsPerRow
  }), [
    courses,
    viewMode,
    currency,
    onCourseClick,
    onEditCourse,
    onDeleteCourse,
    selectedCourseIds,
    onToggleSelection,
    itemsPerRow
  ]);

  if (courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No courses found</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <List
        height={height}
        itemCount={itemCount}
        itemSize={itemSize}
        itemData={itemData}
        width="100%"
        overscanCount={2} // Render 2 extra items for smoother scrolling
      >
        {CourseItem}
      </List>
    </div>
  );
};

export default VirtualizedCourseList;
